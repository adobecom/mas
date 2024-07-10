var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/lit/node_modules/@lit/reactive-element/css-tag.js
var t, e, s, n, o, r, S, c;
var init_css_tag = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/css-tag.js"() {
    t = window;
    e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
    s = Symbol();
    n = /* @__PURE__ */ new WeakMap();
    o = class {
      constructor(t16, e22, n18) {
        if (this._$cssResult$ = true, n18 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = t16, this.t = e22;
      }
      get styleSheet() {
        let t16 = this.o;
        const s14 = this.t;
        if (e && void 0 === t16) {
          const e22 = void 0 !== s14 && 1 === s14.length;
          e22 && (t16 = n.get(s14)), void 0 === t16 && ((this.o = t16 = new CSSStyleSheet()).replaceSync(this.cssText), e22 && n.set(s14, t16));
        }
        return t16;
      }
      toString() {
        return this.cssText;
      }
    };
    r = (t16) => new o("string" == typeof t16 ? t16 : t16 + "", void 0, s);
    S = (s14, n18) => {
      e ? s14.adoptedStyleSheets = n18.map((t16) => t16 instanceof CSSStyleSheet ? t16 : t16.styleSheet) : n18.forEach((e22) => {
        const n19 = document.createElement("style"), o26 = t.litNonce;
        void 0 !== o26 && n19.setAttribute("nonce", o26), n19.textContent = e22.cssText, s14.appendChild(n19);
      });
    };
    c = e ? (t16) => t16 : (t16) => t16 instanceof CSSStyleSheet ? ((t17) => {
      let e22 = "";
      for (const s14 of t17.cssRules) e22 += s14.cssText;
      return r(e22);
    })(t16) : t16;
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/reactive-element.js
var s2, e2, r2, h, o2, n2, a, l, d, u;
var init_reactive_element = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/reactive-element.js"() {
    init_css_tag();
    init_css_tag();
    e2 = window;
    r2 = e2.trustedTypes;
    h = r2 ? r2.emptyScript : "";
    o2 = e2.reactiveElementPolyfillSupport;
    n2 = { toAttribute(t16, i20) {
      switch (i20) {
        case Boolean:
          t16 = t16 ? h : null;
          break;
        case Object:
        case Array:
          t16 = null == t16 ? t16 : JSON.stringify(t16);
      }
      return t16;
    }, fromAttribute(t16, i20) {
      let s14 = t16;
      switch (i20) {
        case Boolean:
          s14 = null !== t16;
          break;
        case Number:
          s14 = null === t16 ? null : Number(t16);
          break;
        case Object:
        case Array:
          try {
            s14 = JSON.parse(t16);
          } catch (t17) {
            s14 = null;
          }
      }
      return s14;
    } };
    a = (t16, i20) => i20 !== t16 && (i20 == i20 || t16 == t16);
    l = { attribute: true, type: String, converter: n2, reflect: false, hasChanged: a };
    d = "finalized";
    u = class extends HTMLElement {
      constructor() {
        super(), this._$Ei = /* @__PURE__ */ new Map(), this.isUpdatePending = false, this.hasUpdated = false, this._$El = null, this._$Eu();
      }
      static addInitializer(t16) {
        var i20;
        this.finalize(), (null !== (i20 = this.h) && void 0 !== i20 ? i20 : this.h = []).push(t16);
      }
      static get observedAttributes() {
        this.finalize();
        const t16 = [];
        return this.elementProperties.forEach((i20, s14) => {
          const e22 = this._$Ep(s14, i20);
          void 0 !== e22 && (this._$Ev.set(e22, s14), t16.push(e22));
        }), t16;
      }
      static createProperty(t16, i20 = l) {
        if (i20.state && (i20.attribute = false), this.finalize(), this.elementProperties.set(t16, i20), !i20.noAccessor && !this.prototype.hasOwnProperty(t16)) {
          const s14 = "symbol" == typeof t16 ? Symbol() : "__" + t16, e22 = this.getPropertyDescriptor(t16, s14, i20);
          void 0 !== e22 && Object.defineProperty(this.prototype, t16, e22);
        }
      }
      static getPropertyDescriptor(t16, i20, s14) {
        return { get() {
          return this[i20];
        }, set(e22) {
          const r16 = this[t16];
          this[i20] = e22, this.requestUpdate(t16, r16, s14);
        }, configurable: true, enumerable: true };
      }
      static getPropertyOptions(t16) {
        return this.elementProperties.get(t16) || l;
      }
      static finalize() {
        if (this.hasOwnProperty(d)) return false;
        this[d] = true;
        const t16 = Object.getPrototypeOf(this);
        if (t16.finalize(), void 0 !== t16.h && (this.h = [...t16.h]), this.elementProperties = new Map(t16.elementProperties), this._$Ev = /* @__PURE__ */ new Map(), this.hasOwnProperty("properties")) {
          const t17 = this.properties, i20 = [...Object.getOwnPropertyNames(t17), ...Object.getOwnPropertySymbols(t17)];
          for (const s14 of i20) this.createProperty(s14, t17[s14]);
        }
        return this.elementStyles = this.finalizeStyles(this.styles), true;
      }
      static finalizeStyles(i20) {
        const s14 = [];
        if (Array.isArray(i20)) {
          const e22 = new Set(i20.flat(1 / 0).reverse());
          for (const i21 of e22) s14.unshift(c(i21));
        } else void 0 !== i20 && s14.push(c(i20));
        return s14;
      }
      static _$Ep(t16, i20) {
        const s14 = i20.attribute;
        return false === s14 ? void 0 : "string" == typeof s14 ? s14 : "string" == typeof t16 ? t16.toLowerCase() : void 0;
      }
      _$Eu() {
        var t16;
        this._$E_ = new Promise((t17) => this.enableUpdating = t17), this._$AL = /* @__PURE__ */ new Map(), this._$Eg(), this.requestUpdate(), null === (t16 = this.constructor.h) || void 0 === t16 || t16.forEach((t17) => t17(this));
      }
      addController(t16) {
        var i20, s14;
        (null !== (i20 = this._$ES) && void 0 !== i20 ? i20 : this._$ES = []).push(t16), void 0 !== this.renderRoot && this.isConnected && (null === (s14 = t16.hostConnected) || void 0 === s14 || s14.call(t16));
      }
      removeController(t16) {
        var i20;
        null === (i20 = this._$ES) || void 0 === i20 || i20.splice(this._$ES.indexOf(t16) >>> 0, 1);
      }
      _$Eg() {
        this.constructor.elementProperties.forEach((t16, i20) => {
          this.hasOwnProperty(i20) && (this._$Ei.set(i20, this[i20]), delete this[i20]);
        });
      }
      createRenderRoot() {
        var t16;
        const s14 = null !== (t16 = this.shadowRoot) && void 0 !== t16 ? t16 : this.attachShadow(this.constructor.shadowRootOptions);
        return S(s14, this.constructor.elementStyles), s14;
      }
      connectedCallback() {
        var t16;
        void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
          var i20;
          return null === (i20 = t17.hostConnected) || void 0 === i20 ? void 0 : i20.call(t17);
        });
      }
      enableUpdating(t16) {
      }
      disconnectedCallback() {
        var t16;
        null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
          var i20;
          return null === (i20 = t17.hostDisconnected) || void 0 === i20 ? void 0 : i20.call(t17);
        });
      }
      attributeChangedCallback(t16, i20, s14) {
        this._$AK(t16, s14);
      }
      _$EO(t16, i20, s14 = l) {
        var e22;
        const r16 = this.constructor._$Ep(t16, s14);
        if (void 0 !== r16 && true === s14.reflect) {
          const h11 = (void 0 !== (null === (e22 = s14.converter) || void 0 === e22 ? void 0 : e22.toAttribute) ? s14.converter : n2).toAttribute(i20, s14.type);
          this._$El = t16, null == h11 ? this.removeAttribute(r16) : this.setAttribute(r16, h11), this._$El = null;
        }
      }
      _$AK(t16, i20) {
        var s14;
        const e22 = this.constructor, r16 = e22._$Ev.get(t16);
        if (void 0 !== r16 && this._$El !== r16) {
          const t17 = e22.getPropertyOptions(r16), h11 = "function" == typeof t17.converter ? { fromAttribute: t17.converter } : void 0 !== (null === (s14 = t17.converter) || void 0 === s14 ? void 0 : s14.fromAttribute) ? t17.converter : n2;
          this._$El = r16, this[r16] = h11.fromAttribute(i20, t17.type), this._$El = null;
        }
      }
      requestUpdate(t16, i20, s14) {
        let e22 = true;
        void 0 !== t16 && (((s14 = s14 || this.constructor.getPropertyOptions(t16)).hasChanged || a)(this[t16], i20) ? (this._$AL.has(t16) || this._$AL.set(t16, i20), true === s14.reflect && this._$El !== t16 && (void 0 === this._$EC && (this._$EC = /* @__PURE__ */ new Map()), this._$EC.set(t16, s14))) : e22 = false), !this.isUpdatePending && e22 && (this._$E_ = this._$Ej());
      }
      async _$Ej() {
        this.isUpdatePending = true;
        try {
          await this._$E_;
        } catch (t17) {
          Promise.reject(t17);
        }
        const t16 = this.scheduleUpdate();
        return null != t16 && await t16, !this.isUpdatePending;
      }
      scheduleUpdate() {
        return this.performUpdate();
      }
      performUpdate() {
        var t16;
        if (!this.isUpdatePending) return;
        this.hasUpdated, this._$Ei && (this._$Ei.forEach((t17, i21) => this[i21] = t17), this._$Ei = void 0);
        let i20 = false;
        const s14 = this._$AL;
        try {
          i20 = this.shouldUpdate(s14), i20 ? (this.willUpdate(s14), null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
            var i21;
            return null === (i21 = t17.hostUpdate) || void 0 === i21 ? void 0 : i21.call(t17);
          }), this.update(s14)) : this._$Ek();
        } catch (t17) {
          throw i20 = false, this._$Ek(), t17;
        }
        i20 && this._$AE(s14);
      }
      willUpdate(t16) {
      }
      _$AE(t16) {
        var i20;
        null === (i20 = this._$ES) || void 0 === i20 || i20.forEach((t17) => {
          var i21;
          return null === (i21 = t17.hostUpdated) || void 0 === i21 ? void 0 : i21.call(t17);
        }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t16)), this.updated(t16);
      }
      _$Ek() {
        this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
      }
      get updateComplete() {
        return this.getUpdateComplete();
      }
      getUpdateComplete() {
        return this._$E_;
      }
      shouldUpdate(t16) {
        return true;
      }
      update(t16) {
        void 0 !== this._$EC && (this._$EC.forEach((t17, i20) => this._$EO(i20, this[i20], t17)), this._$EC = void 0), this._$Ek();
      }
      updated(t16) {
      }
      firstUpdated(t16) {
      }
    };
    u[d] = true, u.elementProperties = /* @__PURE__ */ new Map(), u.elementStyles = [], u.shadowRootOptions = { mode: "open" }, null == o2 || o2({ ReactiveElement: u }), (null !== (s2 = e2.reactiveElementVersions) && void 0 !== s2 ? s2 : e2.reactiveElementVersions = []).push("1.6.3");
  }
});

// ../node_modules/lit-html/lit-html.js
function P(t16, i20) {
  if (!Array.isArray(t16) || !t16.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i20) : i20;
}
function S2(t16, i20, s14 = t16, e22) {
  var o26, n18, l14, h11;
  if (i20 === T) return i20;
  let r16 = void 0 !== e22 ? null === (o26 = s14._$Co) || void 0 === o26 ? void 0 : o26[e22] : s14._$Cl;
  const u14 = d2(i20) ? void 0 : i20._$litDirective$;
  return (null == r16 ? void 0 : r16.constructor) !== u14 && (null === (n18 = null == r16 ? void 0 : r16._$AO) || void 0 === n18 || n18.call(r16, false), void 0 === u14 ? r16 = void 0 : (r16 = new u14(t16), r16._$AT(t16, s14, e22)), void 0 !== e22 ? (null !== (l14 = (h11 = s14)._$Co) && void 0 !== l14 ? l14 : h11._$Co = [])[e22] = r16 : s14._$Cl = r16), void 0 !== r16 && (i20 = S2(t16, r16._$AS(t16, i20.values), r16, e22)), i20;
}
var t2, i2, s3, e3, o3, n3, l2, h2, r3, u2, d2, c2, v, a2, f, _, m, p, g, $, y, w, x, b, T, A, E, C, V, N, M, R, k, H, I, L, z, Z, j, B, D;
var init_lit_html = __esm({
  "../node_modules/lit-html/lit-html.js"() {
    i2 = window;
    s3 = i2.trustedTypes;
    e3 = s3 ? s3.createPolicy("lit-html", { createHTML: (t16) => t16 }) : void 0;
    o3 = "$lit$";
    n3 = `lit$${(Math.random() + "").slice(9)}$`;
    l2 = "?" + n3;
    h2 = `<${l2}>`;
    r3 = document;
    u2 = () => r3.createComment("");
    d2 = (t16) => null === t16 || "object" != typeof t16 && "function" != typeof t16;
    c2 = Array.isArray;
    v = (t16) => c2(t16) || "function" == typeof (null == t16 ? void 0 : t16[Symbol.iterator]);
    a2 = "[ 	\n\f\r]";
    f = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
    _ = /-->/g;
    m = />/g;
    p = RegExp(`>|${a2}(?:([^\\s"'>=/]+)(${a2}*=${a2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
    g = /'/g;
    $ = /"/g;
    y = /^(?:script|style|textarea|title)$/i;
    w = (t16) => (i20, ...s14) => ({ _$litType$: t16, strings: i20, values: s14 });
    x = w(1);
    b = w(2);
    T = Symbol.for("lit-noChange");
    A = Symbol.for("lit-nothing");
    E = /* @__PURE__ */ new WeakMap();
    C = r3.createTreeWalker(r3, 129, null, false);
    V = (t16, i20) => {
      const s14 = t16.length - 1, e22 = [];
      let l14, r16 = 2 === i20 ? "<svg>" : "", u14 = f;
      for (let i21 = 0; i21 < s14; i21++) {
        const s15 = t16[i21];
        let d13, c19, v3 = -1, a10 = 0;
        for (; a10 < s15.length && (u14.lastIndex = a10, c19 = u14.exec(s15), null !== c19); ) a10 = u14.lastIndex, u14 === f ? "!--" === c19[1] ? u14 = _ : void 0 !== c19[1] ? u14 = m : void 0 !== c19[2] ? (y.test(c19[2]) && (l14 = RegExp("</" + c19[2], "g")), u14 = p) : void 0 !== c19[3] && (u14 = p) : u14 === p ? ">" === c19[0] ? (u14 = null != l14 ? l14 : f, v3 = -1) : void 0 === c19[1] ? v3 = -2 : (v3 = u14.lastIndex - c19[2].length, d13 = c19[1], u14 = void 0 === c19[3] ? p : '"' === c19[3] ? $ : g) : u14 === $ || u14 === g ? u14 = p : u14 === _ || u14 === m ? u14 = f : (u14 = p, l14 = void 0);
        const w3 = u14 === p && t16[i21 + 1].startsWith("/>") ? " " : "";
        r16 += u14 === f ? s15 + h2 : v3 >= 0 ? (e22.push(d13), s15.slice(0, v3) + o3 + s15.slice(v3) + n3 + w3) : s15 + n3 + (-2 === v3 ? (e22.push(void 0), i21) : w3);
      }
      return [P(t16, r16 + (t16[s14] || "<?>") + (2 === i20 ? "</svg>" : "")), e22];
    };
    N = class _N {
      constructor({ strings: t16, _$litType$: i20 }, e22) {
        let h11;
        this.parts = [];
        let r16 = 0, d13 = 0;
        const c19 = t16.length - 1, v3 = this.parts, [a10, f8] = V(t16, i20);
        if (this.el = _N.createElement(a10, e22), C.currentNode = this.el.content, 2 === i20) {
          const t17 = this.el.content, i21 = t17.firstChild;
          i21.remove(), t17.append(...i21.childNodes);
        }
        for (; null !== (h11 = C.nextNode()) && v3.length < c19; ) {
          if (1 === h11.nodeType) {
            if (h11.hasAttributes()) {
              const t17 = [];
              for (const i21 of h11.getAttributeNames()) if (i21.endsWith(o3) || i21.startsWith(n3)) {
                const s14 = f8[d13++];
                if (t17.push(i21), void 0 !== s14) {
                  const t18 = h11.getAttribute(s14.toLowerCase() + o3).split(n3), i22 = /([.?@])?(.*)/.exec(s14);
                  v3.push({ type: 1, index: r16, name: i22[2], strings: t18, ctor: "." === i22[1] ? H : "?" === i22[1] ? L : "@" === i22[1] ? z : k });
                } else v3.push({ type: 6, index: r16 });
              }
              for (const i21 of t17) h11.removeAttribute(i21);
            }
            if (y.test(h11.tagName)) {
              const t17 = h11.textContent.split(n3), i21 = t17.length - 1;
              if (i21 > 0) {
                h11.textContent = s3 ? s3.emptyScript : "";
                for (let s14 = 0; s14 < i21; s14++) h11.append(t17[s14], u2()), C.nextNode(), v3.push({ type: 2, index: ++r16 });
                h11.append(t17[i21], u2());
              }
            }
          } else if (8 === h11.nodeType) if (h11.data === l2) v3.push({ type: 2, index: r16 });
          else {
            let t17 = -1;
            for (; -1 !== (t17 = h11.data.indexOf(n3, t17 + 1)); ) v3.push({ type: 7, index: r16 }), t17 += n3.length - 1;
          }
          r16++;
        }
      }
      static createElement(t16, i20) {
        const s14 = r3.createElement("template");
        return s14.innerHTML = t16, s14;
      }
    };
    M = class {
      constructor(t16, i20) {
        this._$AV = [], this._$AN = void 0, this._$AD = t16, this._$AM = i20;
      }
      get parentNode() {
        return this._$AM.parentNode;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      u(t16) {
        var i20;
        const { el: { content: s14 }, parts: e22 } = this._$AD, o26 = (null !== (i20 = null == t16 ? void 0 : t16.creationScope) && void 0 !== i20 ? i20 : r3).importNode(s14, true);
        C.currentNode = o26;
        let n18 = C.nextNode(), l14 = 0, h11 = 0, u14 = e22[0];
        for (; void 0 !== u14; ) {
          if (l14 === u14.index) {
            let i21;
            2 === u14.type ? i21 = new R(n18, n18.nextSibling, this, t16) : 1 === u14.type ? i21 = new u14.ctor(n18, u14.name, u14.strings, this, t16) : 6 === u14.type && (i21 = new Z(n18, this, t16)), this._$AV.push(i21), u14 = e22[++h11];
          }
          l14 !== (null == u14 ? void 0 : u14.index) && (n18 = C.nextNode(), l14++);
        }
        return C.currentNode = r3, o26;
      }
      v(t16) {
        let i20 = 0;
        for (const s14 of this._$AV) void 0 !== s14 && (void 0 !== s14.strings ? (s14._$AI(t16, s14, i20), i20 += s14.strings.length - 2) : s14._$AI(t16[i20])), i20++;
      }
    };
    R = class _R {
      constructor(t16, i20, s14, e22) {
        var o26;
        this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t16, this._$AB = i20, this._$AM = s14, this.options = e22, this._$Cp = null === (o26 = null == e22 ? void 0 : e22.isConnected) || void 0 === o26 || o26;
      }
      get _$AU() {
        var t16, i20;
        return null !== (i20 = null === (t16 = this._$AM) || void 0 === t16 ? void 0 : t16._$AU) && void 0 !== i20 ? i20 : this._$Cp;
      }
      get parentNode() {
        let t16 = this._$AA.parentNode;
        const i20 = this._$AM;
        return void 0 !== i20 && 11 === (null == t16 ? void 0 : t16.nodeType) && (t16 = i20.parentNode), t16;
      }
      get startNode() {
        return this._$AA;
      }
      get endNode() {
        return this._$AB;
      }
      _$AI(t16, i20 = this) {
        t16 = S2(this, t16, i20), d2(t16) ? t16 === A || null == t16 || "" === t16 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t16 !== this._$AH && t16 !== T && this._(t16) : void 0 !== t16._$litType$ ? this.g(t16) : void 0 !== t16.nodeType ? this.$(t16) : v(t16) ? this.T(t16) : this._(t16);
      }
      k(t16) {
        return this._$AA.parentNode.insertBefore(t16, this._$AB);
      }
      $(t16) {
        this._$AH !== t16 && (this._$AR(), this._$AH = this.k(t16));
      }
      _(t16) {
        this._$AH !== A && d2(this._$AH) ? this._$AA.nextSibling.data = t16 : this.$(r3.createTextNode(t16)), this._$AH = t16;
      }
      g(t16) {
        var i20;
        const { values: s14, _$litType$: e22 } = t16, o26 = "number" == typeof e22 ? this._$AC(t16) : (void 0 === e22.el && (e22.el = N.createElement(P(e22.h, e22.h[0]), this.options)), e22);
        if ((null === (i20 = this._$AH) || void 0 === i20 ? void 0 : i20._$AD) === o26) this._$AH.v(s14);
        else {
          const t17 = new M(o26, this), i21 = t17.u(this.options);
          t17.v(s14), this.$(i21), this._$AH = t17;
        }
      }
      _$AC(t16) {
        let i20 = E.get(t16.strings);
        return void 0 === i20 && E.set(t16.strings, i20 = new N(t16)), i20;
      }
      T(t16) {
        c2(this._$AH) || (this._$AH = [], this._$AR());
        const i20 = this._$AH;
        let s14, e22 = 0;
        for (const o26 of t16) e22 === i20.length ? i20.push(s14 = new _R(this.k(u2()), this.k(u2()), this, this.options)) : s14 = i20[e22], s14._$AI(o26), e22++;
        e22 < i20.length && (this._$AR(s14 && s14._$AB.nextSibling, e22), i20.length = e22);
      }
      _$AR(t16 = this._$AA.nextSibling, i20) {
        var s14;
        for (null === (s14 = this._$AP) || void 0 === s14 || s14.call(this, false, true, i20); t16 && t16 !== this._$AB; ) {
          const i21 = t16.nextSibling;
          t16.remove(), t16 = i21;
        }
      }
      setConnected(t16) {
        var i20;
        void 0 === this._$AM && (this._$Cp = t16, null === (i20 = this._$AP) || void 0 === i20 || i20.call(this, t16));
      }
    };
    k = class {
      constructor(t16, i20, s14, e22, o26) {
        this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t16, this.name = i20, this._$AM = e22, this.options = o26, s14.length > 2 || "" !== s14[0] || "" !== s14[1] ? (this._$AH = Array(s14.length - 1).fill(new String()), this.strings = s14) : this._$AH = A;
      }
      get tagName() {
        return this.element.tagName;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AI(t16, i20 = this, s14, e22) {
        const o26 = this.strings;
        let n18 = false;
        if (void 0 === o26) t16 = S2(this, t16, i20, 0), n18 = !d2(t16) || t16 !== this._$AH && t16 !== T, n18 && (this._$AH = t16);
        else {
          const e23 = t16;
          let l14, h11;
          for (t16 = o26[0], l14 = 0; l14 < o26.length - 1; l14++) h11 = S2(this, e23[s14 + l14], i20, l14), h11 === T && (h11 = this._$AH[l14]), n18 || (n18 = !d2(h11) || h11 !== this._$AH[l14]), h11 === A ? t16 = A : t16 !== A && (t16 += (null != h11 ? h11 : "") + o26[l14 + 1]), this._$AH[l14] = h11;
        }
        n18 && !e22 && this.j(t16);
      }
      j(t16) {
        t16 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != t16 ? t16 : "");
      }
    };
    H = class extends k {
      constructor() {
        super(...arguments), this.type = 3;
      }
      j(t16) {
        this.element[this.name] = t16 === A ? void 0 : t16;
      }
    };
    I = s3 ? s3.emptyScript : "";
    L = class extends k {
      constructor() {
        super(...arguments), this.type = 4;
      }
      j(t16) {
        t16 && t16 !== A ? this.element.setAttribute(this.name, I) : this.element.removeAttribute(this.name);
      }
    };
    z = class extends k {
      constructor(t16, i20, s14, e22, o26) {
        super(t16, i20, s14, e22, o26), this.type = 5;
      }
      _$AI(t16, i20 = this) {
        var s14;
        if ((t16 = null !== (s14 = S2(this, t16, i20, 0)) && void 0 !== s14 ? s14 : A) === T) return;
        const e22 = this._$AH, o26 = t16 === A && e22 !== A || t16.capture !== e22.capture || t16.once !== e22.once || t16.passive !== e22.passive, n18 = t16 !== A && (e22 === A || o26);
        o26 && this.element.removeEventListener(this.name, this, e22), n18 && this.element.addEventListener(this.name, this, t16), this._$AH = t16;
      }
      handleEvent(t16) {
        var i20, s14;
        "function" == typeof this._$AH ? this._$AH.call(null !== (s14 = null === (i20 = this.options) || void 0 === i20 ? void 0 : i20.host) && void 0 !== s14 ? s14 : this.element, t16) : this._$AH.handleEvent(t16);
      }
    };
    Z = class {
      constructor(t16, i20, s14) {
        this.element = t16, this.type = 6, this._$AN = void 0, this._$AM = i20, this.options = s14;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AI(t16) {
        S2(this, t16);
      }
    };
    j = { O: o3, P: n3, A: l2, C: 1, M: V, L: M, R: v, D: S2, I: R, V: k, H: L, N: z, U: H, F: Z };
    B = i2.litHtmlPolyfillSupport;
    null == B || B(N, R), (null !== (t2 = i2.litHtmlVersions) && void 0 !== t2 ? t2 : i2.litHtmlVersions = []).push("2.8.0");
    D = (t16, i20, s14) => {
      var e22, o26;
      const n18 = null !== (e22 = null == s14 ? void 0 : s14.renderBefore) && void 0 !== e22 ? e22 : i20;
      let l14 = n18._$litPart$;
      if (void 0 === l14) {
        const t17 = null !== (o26 = null == s14 ? void 0 : s14.renderBefore) && void 0 !== o26 ? o26 : null;
        n18._$litPart$ = l14 = new R(i20.insertBefore(u2(), t17), t17, void 0, null != s14 ? s14 : {});
      }
      return l14._$AI(t16), l14;
    };
  }
});

// ../node_modules/lit-element/node_modules/@lit/reactive-element/css-tag.js
var t3, e4, s4, n4, o4, r4, i3, S3, c3;
var init_css_tag2 = __esm({
  "../node_modules/lit-element/node_modules/@lit/reactive-element/css-tag.js"() {
    t3 = window;
    e4 = t3.ShadowRoot && (void 0 === t3.ShadyCSS || t3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
    s4 = Symbol();
    n4 = /* @__PURE__ */ new WeakMap();
    o4 = class {
      constructor(t16, e22, n18) {
        if (this._$cssResult$ = true, n18 !== s4) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = t16, this.t = e22;
      }
      get styleSheet() {
        let t16 = this.o;
        const s14 = this.t;
        if (e4 && void 0 === t16) {
          const e22 = void 0 !== s14 && 1 === s14.length;
          e22 && (t16 = n4.get(s14)), void 0 === t16 && ((this.o = t16 = new CSSStyleSheet()).replaceSync(this.cssText), e22 && n4.set(s14, t16));
        }
        return t16;
      }
      toString() {
        return this.cssText;
      }
    };
    r4 = (t16) => new o4("string" == typeof t16 ? t16 : t16 + "", void 0, s4);
    i3 = (t16, ...e22) => {
      const n18 = 1 === t16.length ? t16[0] : e22.reduce((e23, s14, n19) => e23 + ((t17) => {
        if (true === t17._$cssResult$) return t17.cssText;
        if ("number" == typeof t17) return t17;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t17 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(s14) + t16[n19 + 1], t16[0]);
      return new o4(n18, t16, s4);
    };
    S3 = (s14, n18) => {
      e4 ? s14.adoptedStyleSheets = n18.map((t16) => t16 instanceof CSSStyleSheet ? t16 : t16.styleSheet) : n18.forEach((e22) => {
        const n19 = document.createElement("style"), o26 = t3.litNonce;
        void 0 !== o26 && n19.setAttribute("nonce", o26), n19.textContent = e22.cssText, s14.appendChild(n19);
      });
    };
    c3 = e4 ? (t16) => t16 : (t16) => t16 instanceof CSSStyleSheet ? ((t17) => {
      let e22 = "";
      for (const s14 of t17.cssRules) e22 += s14.cssText;
      return r4(e22);
    })(t16) : t16;
  }
});

// ../node_modules/lit-element/node_modules/@lit/reactive-element/reactive-element.js
var s5, e5, r5, h3, o5, n5, a3, l3, d3, u3;
var init_reactive_element2 = __esm({
  "../node_modules/lit-element/node_modules/@lit/reactive-element/reactive-element.js"() {
    init_css_tag2();
    init_css_tag2();
    e5 = window;
    r5 = e5.trustedTypes;
    h3 = r5 ? r5.emptyScript : "";
    o5 = e5.reactiveElementPolyfillSupport;
    n5 = { toAttribute(t16, i20) {
      switch (i20) {
        case Boolean:
          t16 = t16 ? h3 : null;
          break;
        case Object:
        case Array:
          t16 = null == t16 ? t16 : JSON.stringify(t16);
      }
      return t16;
    }, fromAttribute(t16, i20) {
      let s14 = t16;
      switch (i20) {
        case Boolean:
          s14 = null !== t16;
          break;
        case Number:
          s14 = null === t16 ? null : Number(t16);
          break;
        case Object:
        case Array:
          try {
            s14 = JSON.parse(t16);
          } catch (t17) {
            s14 = null;
          }
      }
      return s14;
    } };
    a3 = (t16, i20) => i20 !== t16 && (i20 == i20 || t16 == t16);
    l3 = { attribute: true, type: String, converter: n5, reflect: false, hasChanged: a3 };
    d3 = "finalized";
    u3 = class extends HTMLElement {
      constructor() {
        super(), this._$Ei = /* @__PURE__ */ new Map(), this.isUpdatePending = false, this.hasUpdated = false, this._$El = null, this._$Eu();
      }
      static addInitializer(t16) {
        var i20;
        this.finalize(), (null !== (i20 = this.h) && void 0 !== i20 ? i20 : this.h = []).push(t16);
      }
      static get observedAttributes() {
        this.finalize();
        const t16 = [];
        return this.elementProperties.forEach((i20, s14) => {
          const e22 = this._$Ep(s14, i20);
          void 0 !== e22 && (this._$Ev.set(e22, s14), t16.push(e22));
        }), t16;
      }
      static createProperty(t16, i20 = l3) {
        if (i20.state && (i20.attribute = false), this.finalize(), this.elementProperties.set(t16, i20), !i20.noAccessor && !this.prototype.hasOwnProperty(t16)) {
          const s14 = "symbol" == typeof t16 ? Symbol() : "__" + t16, e22 = this.getPropertyDescriptor(t16, s14, i20);
          void 0 !== e22 && Object.defineProperty(this.prototype, t16, e22);
        }
      }
      static getPropertyDescriptor(t16, i20, s14) {
        return { get() {
          return this[i20];
        }, set(e22) {
          const r16 = this[t16];
          this[i20] = e22, this.requestUpdate(t16, r16, s14);
        }, configurable: true, enumerable: true };
      }
      static getPropertyOptions(t16) {
        return this.elementProperties.get(t16) || l3;
      }
      static finalize() {
        if (this.hasOwnProperty(d3)) return false;
        this[d3] = true;
        const t16 = Object.getPrototypeOf(this);
        if (t16.finalize(), void 0 !== t16.h && (this.h = [...t16.h]), this.elementProperties = new Map(t16.elementProperties), this._$Ev = /* @__PURE__ */ new Map(), this.hasOwnProperty("properties")) {
          const t17 = this.properties, i20 = [...Object.getOwnPropertyNames(t17), ...Object.getOwnPropertySymbols(t17)];
          for (const s14 of i20) this.createProperty(s14, t17[s14]);
        }
        return this.elementStyles = this.finalizeStyles(this.styles), true;
      }
      static finalizeStyles(i20) {
        const s14 = [];
        if (Array.isArray(i20)) {
          const e22 = new Set(i20.flat(1 / 0).reverse());
          for (const i21 of e22) s14.unshift(c3(i21));
        } else void 0 !== i20 && s14.push(c3(i20));
        return s14;
      }
      static _$Ep(t16, i20) {
        const s14 = i20.attribute;
        return false === s14 ? void 0 : "string" == typeof s14 ? s14 : "string" == typeof t16 ? t16.toLowerCase() : void 0;
      }
      _$Eu() {
        var t16;
        this._$E_ = new Promise((t17) => this.enableUpdating = t17), this._$AL = /* @__PURE__ */ new Map(), this._$Eg(), this.requestUpdate(), null === (t16 = this.constructor.h) || void 0 === t16 || t16.forEach((t17) => t17(this));
      }
      addController(t16) {
        var i20, s14;
        (null !== (i20 = this._$ES) && void 0 !== i20 ? i20 : this._$ES = []).push(t16), void 0 !== this.renderRoot && this.isConnected && (null === (s14 = t16.hostConnected) || void 0 === s14 || s14.call(t16));
      }
      removeController(t16) {
        var i20;
        null === (i20 = this._$ES) || void 0 === i20 || i20.splice(this._$ES.indexOf(t16) >>> 0, 1);
      }
      _$Eg() {
        this.constructor.elementProperties.forEach((t16, i20) => {
          this.hasOwnProperty(i20) && (this._$Ei.set(i20, this[i20]), delete this[i20]);
        });
      }
      createRenderRoot() {
        var t16;
        const s14 = null !== (t16 = this.shadowRoot) && void 0 !== t16 ? t16 : this.attachShadow(this.constructor.shadowRootOptions);
        return S3(s14, this.constructor.elementStyles), s14;
      }
      connectedCallback() {
        var t16;
        void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
          var i20;
          return null === (i20 = t17.hostConnected) || void 0 === i20 ? void 0 : i20.call(t17);
        });
      }
      enableUpdating(t16) {
      }
      disconnectedCallback() {
        var t16;
        null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
          var i20;
          return null === (i20 = t17.hostDisconnected) || void 0 === i20 ? void 0 : i20.call(t17);
        });
      }
      attributeChangedCallback(t16, i20, s14) {
        this._$AK(t16, s14);
      }
      _$EO(t16, i20, s14 = l3) {
        var e22;
        const r16 = this.constructor._$Ep(t16, s14);
        if (void 0 !== r16 && true === s14.reflect) {
          const h11 = (void 0 !== (null === (e22 = s14.converter) || void 0 === e22 ? void 0 : e22.toAttribute) ? s14.converter : n5).toAttribute(i20, s14.type);
          this._$El = t16, null == h11 ? this.removeAttribute(r16) : this.setAttribute(r16, h11), this._$El = null;
        }
      }
      _$AK(t16, i20) {
        var s14;
        const e22 = this.constructor, r16 = e22._$Ev.get(t16);
        if (void 0 !== r16 && this._$El !== r16) {
          const t17 = e22.getPropertyOptions(r16), h11 = "function" == typeof t17.converter ? { fromAttribute: t17.converter } : void 0 !== (null === (s14 = t17.converter) || void 0 === s14 ? void 0 : s14.fromAttribute) ? t17.converter : n5;
          this._$El = r16, this[r16] = h11.fromAttribute(i20, t17.type), this._$El = null;
        }
      }
      requestUpdate(t16, i20, s14) {
        let e22 = true;
        void 0 !== t16 && (((s14 = s14 || this.constructor.getPropertyOptions(t16)).hasChanged || a3)(this[t16], i20) ? (this._$AL.has(t16) || this._$AL.set(t16, i20), true === s14.reflect && this._$El !== t16 && (void 0 === this._$EC && (this._$EC = /* @__PURE__ */ new Map()), this._$EC.set(t16, s14))) : e22 = false), !this.isUpdatePending && e22 && (this._$E_ = this._$Ej());
      }
      async _$Ej() {
        this.isUpdatePending = true;
        try {
          await this._$E_;
        } catch (t17) {
          Promise.reject(t17);
        }
        const t16 = this.scheduleUpdate();
        return null != t16 && await t16, !this.isUpdatePending;
      }
      scheduleUpdate() {
        return this.performUpdate();
      }
      performUpdate() {
        var t16;
        if (!this.isUpdatePending) return;
        this.hasUpdated, this._$Ei && (this._$Ei.forEach((t17, i21) => this[i21] = t17), this._$Ei = void 0);
        let i20 = false;
        const s14 = this._$AL;
        try {
          i20 = this.shouldUpdate(s14), i20 ? (this.willUpdate(s14), null === (t16 = this._$ES) || void 0 === t16 || t16.forEach((t17) => {
            var i21;
            return null === (i21 = t17.hostUpdate) || void 0 === i21 ? void 0 : i21.call(t17);
          }), this.update(s14)) : this._$Ek();
        } catch (t17) {
          throw i20 = false, this._$Ek(), t17;
        }
        i20 && this._$AE(s14);
      }
      willUpdate(t16) {
      }
      _$AE(t16) {
        var i20;
        null === (i20 = this._$ES) || void 0 === i20 || i20.forEach((t17) => {
          var i21;
          return null === (i21 = t17.hostUpdated) || void 0 === i21 ? void 0 : i21.call(t17);
        }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t16)), this.updated(t16);
      }
      _$Ek() {
        this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
      }
      get updateComplete() {
        return this.getUpdateComplete();
      }
      getUpdateComplete() {
        return this._$E_;
      }
      shouldUpdate(t16) {
        return true;
      }
      update(t16) {
        void 0 !== this._$EC && (this._$EC.forEach((t17, i20) => this._$EO(i20, this[i20], t17)), this._$EC = void 0), this._$Ek();
      }
      updated(t16) {
      }
      firstUpdated(t16) {
      }
    };
    u3[d3] = true, u3.elementProperties = /* @__PURE__ */ new Map(), u3.elementStyles = [], u3.shadowRootOptions = { mode: "open" }, null == o5 || o5({ ReactiveElement: u3 }), (null !== (s5 = e5.reactiveElementVersions) && void 0 !== s5 ? s5 : e5.reactiveElementVersions = []).push("1.6.3");
  }
});

// ../node_modules/lit-element/lit-element.js
var l4, o6, s6, n6;
var init_lit_element = __esm({
  "../node_modules/lit-element/lit-element.js"() {
    init_reactive_element2();
    init_reactive_element2();
    init_lit_html();
    init_lit_html();
    s6 = class extends u3 {
      constructor() {
        super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
      }
      createRenderRoot() {
        var t16, e22;
        const i20 = super.createRenderRoot();
        return null !== (t16 = (e22 = this.renderOptions).renderBefore) && void 0 !== t16 || (e22.renderBefore = i20.firstChild), i20;
      }
      update(t16) {
        const i20 = this.render();
        this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t16), this._$Do = D(i20, this.renderRoot, this.renderOptions);
      }
      connectedCallback() {
        var t16;
        super.connectedCallback(), null === (t16 = this._$Do) || void 0 === t16 || t16.setConnected(true);
      }
      disconnectedCallback() {
        var t16;
        super.disconnectedCallback(), null === (t16 = this._$Do) || void 0 === t16 || t16.setConnected(false);
      }
      render() {
        return T;
      }
    };
    s6.finalized = true, s6._$litElement$ = true, null === (l4 = globalThis.litElementHydrateSupport) || void 0 === l4 || l4.call(globalThis, { LitElement: s6 });
    n6 = globalThis.litElementPolyfillSupport;
    null == n6 || n6({ LitElement: s6 });
    (null !== (o6 = globalThis.litElementVersions) && void 0 !== o6 ? o6 : globalThis.litElementVersions = []).push("3.3.3");
  }
});

// ../node_modules/lit-html/is-server.js
var init_is_server = __esm({
  "../node_modules/lit-html/is-server.js"() {
  }
});

// ../node_modules/lit/index.js
var init_lit = __esm({
  "../node_modules/lit/index.js"() {
    init_reactive_element();
    init_lit_html();
    init_lit_element();
    init_is_server();
  }
});

// ../node_modules/@spectrum-web-components/base/src/version.js
var version;
var init_version = __esm({
  "../node_modules/@spectrum-web-components/base/src/version.js"() {
    version = "0.43.0";
  }
});

// ../node_modules/@spectrum-web-components/base/src/Base.js
function SpectrumMixin(s14) {
  class o26 extends s14 {
    get isLTR() {
      return this.dir === "ltr";
    }
    hasVisibleFocusInTree() {
      const n18 = ((r16 = document) => {
        var l14;
        let t16 = r16.activeElement;
        for (; t16 != null && t16.shadowRoot && t16.shadowRoot.activeElement; ) t16 = t16.shadowRoot.activeElement;
        const a10 = t16 ? [t16] : [];
        for (; t16; ) {
          const i20 = t16.assignedSlot || t16.parentElement || ((l14 = t16.getRootNode()) == null ? void 0 : l14.host);
          i20 && a10.push(i20), t16 = i20;
        }
        return a10;
      })(this.getRootNode())[0];
      if (!n18) return false;
      try {
        return n18.matches(":focus-visible") || n18.matches(".focus-visible");
      } catch (r16) {
        return n18.matches(".focus-visible");
      }
    }
    connectedCallback() {
      if (!this.hasAttribute("dir")) {
        let e22 = this.assignedSlot || this.parentNode;
        for (; e22 !== document.documentElement && !p2(e22); ) e22 = e22.assignedSlot || e22.parentNode || e22.host;
        if (this.dir = e22.dir === "rtl" ? e22.dir : this.dir || "ltr", e22 === document.documentElement) c4.add(this);
        else {
          const { localName: n18 } = e22;
          n18.search("-") > -1 && !customElements.get(n18) ? customElements.whenDefined(n18).then(() => {
            e22.startManagingContentDirection(this);
          }) : e22.startManagingContentDirection(this);
        }
        this._dirParent = e22;
      }
      super.connectedCallback();
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._dirParent && (this._dirParent === document.documentElement ? c4.delete(this) : this._dirParent.stopManagingContentDirection(this), this.removeAttribute("dir"));
    }
  }
  return o26;
}
var c4, g2, w2, p2, SpectrumElement;
var init_Base = __esm({
  "../node_modules/@spectrum-web-components/base/src/Base.js"() {
    "use strict";
    init_lit();
    init_version();
    c4 = /* @__PURE__ */ new Set();
    g2 = () => {
      const s14 = document.documentElement.dir === "rtl" ? document.documentElement.dir : "ltr";
      c4.forEach((o26) => {
        o26.setAttribute("dir", s14);
      });
    };
    w2 = new MutationObserver(g2);
    w2.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    p2 = (s14) => typeof s14.startManagingContentDirection != "undefined" || s14.tagName === "SP-THEME";
    SpectrumElement = class extends SpectrumMixin(s6) {
    };
    SpectrumElement.VERSION = version;
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/custom-element.js
var init_custom_element = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/custom-element.js"() {
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/property.js
function n7(n18) {
  return (t16, o26) => void 0 !== o26 ? e6(n18, t16, o26) : i4(n18, t16);
}
var i4, e6;
var init_property = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/property.js"() {
    i4 = (i20, e22) => "method" === e22.kind && e22.descriptor && !("value" in e22.descriptor) ? { ...e22, finisher(n18) {
      n18.createProperty(e22.key, i20);
    } } : { kind: "field", key: Symbol(), placement: "own", descriptor: {}, originalKey: e22.key, initializer() {
      "function" == typeof e22.initializer && (this[e22.key] = e22.initializer.call(this));
    }, finisher(n18) {
      n18.createProperty(e22.key, i20);
    } };
    e6 = (i20, e22, n18) => {
      e22.constructor.createProperty(n18, i20);
    };
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/state.js
function t4(t16) {
  return n7({ ...t16, state: true });
}
var init_state = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/state.js"() {
    init_property();
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/base.js
var o7;
var init_base = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/base.js"() {
    o7 = ({ finisher: e22, descriptor: t16 }) => (o26, n18) => {
      var r16;
      if (void 0 === n18) {
        const n19 = null !== (r16 = o26.originalKey) && void 0 !== r16 ? r16 : o26.key, i20 = null != t16 ? { kind: "method", placement: "prototype", key: n19, descriptor: t16(o26.key) } : { ...o26, key: n19 };
        return null != e22 && (i20.finisher = function(t17) {
          e22(t17, n19);
        }), i20;
      }
      {
        const r17 = o26.constructor;
        void 0 !== t16 && Object.defineProperty(o26, n18, t16(n18)), null == e22 || e22(r17, n18);
      }
    };
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/event-options.js
var init_event_options = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/event-options.js"() {
    init_base();
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/query.js
function i5(i20, n18) {
  return o7({ descriptor: (o26) => {
    const t16 = { get() {
      var o27, n19;
      return null !== (n19 = null === (o27 = this.renderRoot) || void 0 === o27 ? void 0 : o27.querySelector(i20)) && void 0 !== n19 ? n19 : null;
    }, enumerable: true, configurable: true };
    if (n18) {
      const n19 = "symbol" == typeof o26 ? Symbol() : "__" + o26;
      t16.get = function() {
        var o27, t17;
        return void 0 === this[n19] && (this[n19] = null !== (t17 = null === (o27 = this.renderRoot) || void 0 === o27 ? void 0 : o27.querySelector(i20)) && void 0 !== t17 ? t17 : null), this[n19];
      };
    }
    return t16;
  } });
}
var init_query = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/query.js"() {
    init_base();
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-all.js
var init_query_all = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-all.js"() {
    init_base();
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-async.js
var init_query_async = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-async.js"() {
    init_base();
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-assigned-elements.js
function l5(n18) {
  const { slot: l14, selector: t16 } = null != n18 ? n18 : {};
  return o7({ descriptor: (o26) => ({ get() {
    var o27;
    const r16 = "slot" + (l14 ? `[name=${l14}]` : ":not([name])"), i20 = null === (o27 = this.renderRoot) || void 0 === o27 ? void 0 : o27.querySelector(r16), s14 = null != i20 ? e7(i20, n18) : [];
    return t16 ? s14.filter((o28) => o28.matches(t16)) : s14;
  }, enumerable: true, configurable: true }) });
}
var n8, e7;
var init_query_assigned_elements = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-assigned-elements.js"() {
    init_base();
    e7 = null != (null === (n8 = window.HTMLSlotElement) || void 0 === n8 ? void 0 : n8.prototype.assignedElements) ? (o26, n18) => o26.assignedElements(n18) : (o26, n18) => o26.assignedNodes(n18).filter((o27) => o27.nodeType === Node.ELEMENT_NODE);
  }
});

// ../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-assigned-nodes.js
function o8(o26, n18, r16) {
  let l14, s14 = o26;
  return "object" == typeof o26 ? (s14 = o26.slot, l14 = o26) : l14 = { flatten: n18 }, r16 ? l5({ slot: s14, flatten: n18, selector: r16 }) : o7({ descriptor: (e22) => ({ get() {
    var e23, t16;
    const o27 = "slot" + (s14 ? `[name=${s14}]` : ":not([name])"), n19 = null === (e23 = this.renderRoot) || void 0 === e23 ? void 0 : e23.querySelector(o27);
    return null !== (t16 = null == n19 ? void 0 : n19.assignedNodes(l14)) && void 0 !== t16 ? t16 : [];
  }, enumerable: true, configurable: true }) });
}
var init_query_assigned_nodes = __esm({
  "../node_modules/lit/node_modules/@lit/reactive-element/decorators/query-assigned-nodes.js"() {
    init_base();
    init_query_assigned_elements();
  }
});

// ../node_modules/lit/decorators.js
var init_decorators = __esm({
  "../node_modules/lit/decorators.js"() {
    init_custom_element();
    init_property();
    init_state();
    init_event_options();
    init_query();
    init_query_all();
    init_query_async();
    init_query_assigned_elements();
    init_query_assigned_nodes();
  }
});

// ../node_modules/@spectrum-web-components/base/src/sizedMixin.js
function SizedMixin(r16, { validSizes: i20 = ["s", "m", "l", "xl"], noDefaultSize: s14, defaultSize: t16 = "m" } = {}) {
  class e22 extends r16 {
    constructor() {
      super(...arguments);
      this._size = t16;
    }
    get size() {
      return this._size || t16;
    }
    set size(n18) {
      const p18 = s14 ? null : t16, z2 = n18 && n18.toLocaleLowerCase(), x4 = i20.includes(z2) ? z2 : p18;
      if (x4 && this.setAttribute("size", x4), this._size === x4) return;
      const c19 = this._size;
      this._size = x4, this.requestUpdate("size", c19);
    }
    update(n18) {
      !this.hasAttribute("size") && !s14 && this.setAttribute("size", this.size), super.update(n18);
    }
  }
  return m2([n7({ type: String })], e22.prototype, "size", 1), e22;
}
var a4, u4, m2;
var init_sizedMixin = __esm({
  "../node_modules/@spectrum-web-components/base/src/sizedMixin.js"() {
    "use strict";
    init_decorators();
    a4 = Object.defineProperty;
    u4 = Object.getOwnPropertyDescriptor;
    m2 = (r16, i20, s14, t16) => {
      for (var e22 = t16 > 1 ? void 0 : t16 ? u4(i20, s14) : i20, l14 = r16.length - 1, o26; l14 >= 0; l14--) (o26 = r16[l14]) && (e22 = (t16 ? o26(i20, s14, e22) : o26(e22)) || e22);
      return t16 && e22 && a4(i20, s14, e22), e22;
    };
  }
});

// ../node_modules/@spectrum-web-components/base/src/index.js
var init_src = __esm({
  "../node_modules/@spectrum-web-components/base/src/index.js"() {
    "use strict";
    init_Base();
    init_sizedMixin();
    init_lit();
  }
});

// ../node_modules/@spectrum-web-components/base/src/decorators.js
var init_decorators2 = __esm({
  "../node_modules/@spectrum-web-components/base/src/decorators.js"() {
    "use strict";
    init_decorators();
  }
});

// ../node_modules/lit-html/directives/if-defined.js
var l6;
var init_if_defined = __esm({
  "../node_modules/lit-html/directives/if-defined.js"() {
    init_lit_html();
    l6 = (l14) => null != l14 ? l14 : A;
  }
});

// ../node_modules/lit/directives/if-defined.js
var init_if_defined2 = __esm({
  "../node_modules/lit/directives/if-defined.js"() {
    init_if_defined();
  }
});

// ../node_modules/lit-html/directive.js
var t5, e8, i6;
var init_directive = __esm({
  "../node_modules/lit-html/directive.js"() {
    t5 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
    e8 = (t16) => (...e22) => ({ _$litDirective$: t16, values: e22 });
    i6 = class {
      constructor(t16) {
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AT(t16, e22, i20) {
        this._$Ct = t16, this._$AM = e22, this._$Ci = i20;
      }
      _$AS(t16, e22) {
        return this.update(t16, e22);
      }
      update(t16, e22) {
        return this.render(...e22);
      }
    };
  }
});

// ../node_modules/lit-html/directive-helpers.js
var l7, i7, e9, r6, c5, f2, s7, a5, m3, p3;
var init_directive_helpers = __esm({
  "../node_modules/lit-html/directive-helpers.js"() {
    init_lit_html();
    ({ I: l7 } = j);
    i7 = (o26) => null === o26 || "object" != typeof o26 && "function" != typeof o26;
    e9 = (o26) => void 0 === o26.strings;
    r6 = () => document.createComment("");
    c5 = (o26, i20, n18) => {
      var t16;
      const v3 = o26._$AA.parentNode, d13 = void 0 === i20 ? o26._$AB : i20._$AA;
      if (void 0 === n18) {
        const i21 = v3.insertBefore(r6(), d13), t17 = v3.insertBefore(r6(), d13);
        n18 = new l7(i21, t17, o26, o26.options);
      } else {
        const l14 = n18._$AB.nextSibling, i21 = n18._$AM, u14 = i21 !== o26;
        if (u14) {
          let l15;
          null === (t16 = n18._$AQ) || void 0 === t16 || t16.call(n18, o26), n18._$AM = o26, void 0 !== n18._$AP && (l15 = o26._$AU) !== i21._$AU && n18._$AP(l15);
        }
        if (l14 !== d13 || u14) {
          let o27 = n18._$AA;
          for (; o27 !== l14; ) {
            const l15 = o27.nextSibling;
            v3.insertBefore(o27, d13), o27 = l15;
          }
        }
      }
      return n18;
    };
    f2 = (o26, l14, i20 = o26) => (o26._$AI(l14, i20), o26);
    s7 = {};
    a5 = (o26, l14 = s7) => o26._$AH = l14;
    m3 = (o26) => o26._$AH;
    p3 = (o26) => {
      var l14;
      null === (l14 = o26._$AP) || void 0 === l14 || l14.call(o26, false, true);
      let i20 = o26._$AA;
      const n18 = o26._$AB.nextSibling;
      for (; i20 !== n18; ) {
        const o27 = i20.nextSibling;
        i20.remove(), i20 = o27;
      }
    };
  }
});

// ../node_modules/lit-html/directives/repeat.js
var u5, c6;
var init_repeat = __esm({
  "../node_modules/lit-html/directives/repeat.js"() {
    init_lit_html();
    init_directive();
    init_directive_helpers();
    u5 = (e22, s14, t16) => {
      const r16 = /* @__PURE__ */ new Map();
      for (let l14 = s14; l14 <= t16; l14++) r16.set(e22[l14], l14);
      return r16;
    };
    c6 = e8(class extends i6 {
      constructor(e22) {
        if (super(e22), e22.type !== t5.CHILD) throw Error("repeat() can only be used in text expressions");
      }
      ct(e22, s14, t16) {
        let r16;
        void 0 === t16 ? t16 = s14 : void 0 !== s14 && (r16 = s14);
        const l14 = [], o26 = [];
        let i20 = 0;
        for (const s15 of e22) l14[i20] = r16 ? r16(s15, i20) : i20, o26[i20] = t16(s15, i20), i20++;
        return { values: o26, keys: l14 };
      }
      render(e22, s14, t16) {
        return this.ct(e22, s14, t16).values;
      }
      update(s14, [t16, r16, c19]) {
        var d13;
        const a10 = m3(s14), { values: p18, keys: v3 } = this.ct(t16, r16, c19);
        if (!Array.isArray(a10)) return this.ut = v3, p18;
        const h11 = null !== (d13 = this.ut) && void 0 !== d13 ? d13 : this.ut = [], m10 = [];
        let y3, x4, j2 = 0, k2 = a10.length - 1, w3 = 0, A2 = p18.length - 1;
        for (; j2 <= k2 && w3 <= A2; ) if (null === a10[j2]) j2++;
        else if (null === a10[k2]) k2--;
        else if (h11[j2] === v3[w3]) m10[w3] = f2(a10[j2], p18[w3]), j2++, w3++;
        else if (h11[k2] === v3[A2]) m10[A2] = f2(a10[k2], p18[A2]), k2--, A2--;
        else if (h11[j2] === v3[A2]) m10[A2] = f2(a10[j2], p18[A2]), c5(s14, m10[A2 + 1], a10[j2]), j2++, A2--;
        else if (h11[k2] === v3[w3]) m10[w3] = f2(a10[k2], p18[w3]), c5(s14, a10[j2], a10[k2]), k2--, w3++;
        else if (void 0 === y3 && (y3 = u5(v3, w3, A2), x4 = u5(h11, j2, k2)), y3.has(h11[j2])) if (y3.has(h11[k2])) {
          const e22 = x4.get(v3[w3]), t17 = void 0 !== e22 ? a10[e22] : null;
          if (null === t17) {
            const e23 = c5(s14, a10[j2]);
            f2(e23, p18[w3]), m10[w3] = e23;
          } else m10[w3] = f2(t17, p18[w3]), c5(s14, a10[j2], t17), a10[e22] = null;
          w3++;
        } else p3(a10[k2]), k2--;
        else p3(a10[j2]), j2++;
        for (; w3 <= A2; ) {
          const e22 = c5(s14, m10[A2 + 1]);
          f2(e22, p18[w3]), m10[w3++] = e22;
        }
        for (; j2 <= k2; ) {
          const e22 = a10[j2++];
          null !== e22 && p3(e22);
        }
        return this.ut = v3, a5(s14, m10), T;
      }
    });
  }
});

// ../node_modules/lit/directives/repeat.js
var init_repeat2 = __esm({
  "../node_modules/lit/directives/repeat.js"() {
    init_repeat();
  }
});

// ../node_modules/lit-html/directives/class-map.js
var o9;
var init_class_map = __esm({
  "../node_modules/lit-html/directives/class-map.js"() {
    init_lit_html();
    init_directive();
    o9 = e8(class extends i6 {
      constructor(t16) {
        var i20;
        if (super(t16), t16.type !== t5.ATTRIBUTE || "class" !== t16.name || (null === (i20 = t16.strings) || void 0 === i20 ? void 0 : i20.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
      }
      render(t16) {
        return " " + Object.keys(t16).filter((i20) => t16[i20]).join(" ") + " ";
      }
      update(i20, [s14]) {
        var r16, o26;
        if (void 0 === this.it) {
          this.it = /* @__PURE__ */ new Set(), void 0 !== i20.strings && (this.nt = new Set(i20.strings.join(" ").split(/\s/).filter((t16) => "" !== t16)));
          for (const t16 in s14) s14[t16] && !(null === (r16 = this.nt) || void 0 === r16 ? void 0 : r16.has(t16)) && this.it.add(t16);
          return this.render(s14);
        }
        const e22 = i20.element.classList;
        this.it.forEach((t16) => {
          t16 in s14 || (e22.remove(t16), this.it.delete(t16));
        });
        for (const t16 in s14) {
          const i21 = !!s14[t16];
          i21 === this.it.has(t16) || (null === (o26 = this.nt) || void 0 === o26 ? void 0 : o26.has(t16)) || (i21 ? (e22.add(t16), this.it.add(t16)) : (e22.remove(t16), this.it.delete(t16)));
        }
        return T;
      }
    });
  }
});

// ../node_modules/lit/directives/class-map.js
var init_class_map2 = __esm({
  "../node_modules/lit/directives/class-map.js"() {
    init_class_map();
  }
});

// ../node_modules/lit-html/directives/style-map.js
var i8, n9, o10;
var init_style_map = __esm({
  "../node_modules/lit-html/directives/style-map.js"() {
    init_lit_html();
    init_directive();
    i8 = "important";
    n9 = " !" + i8;
    o10 = e8(class extends i6 {
      constructor(t16) {
        var e22;
        if (super(t16), t16.type !== t5.ATTRIBUTE || "style" !== t16.name || (null === (e22 = t16.strings) || void 0 === e22 ? void 0 : e22.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
      }
      render(t16) {
        return Object.keys(t16).reduce((e22, r16) => {
          const s14 = t16[r16];
          return null == s14 ? e22 : e22 + `${r16 = r16.includes("-") ? r16 : r16.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s14};`;
        }, "");
      }
      update(e22, [r16]) {
        const { style: s14 } = e22.element;
        if (void 0 === this.ht) {
          this.ht = /* @__PURE__ */ new Set();
          for (const t16 in r16) this.ht.add(t16);
          return this.render(r16);
        }
        this.ht.forEach((t16) => {
          null == r16[t16] && (this.ht.delete(t16), t16.includes("-") ? s14.removeProperty(t16) : s14[t16] = "");
        });
        for (const t16 in r16) {
          const e23 = r16[t16];
          if (null != e23) {
            this.ht.add(t16);
            const r17 = "string" == typeof e23 && e23.endsWith(n9);
            t16.includes("-") || r17 ? s14.setProperty(t16, r17 ? e23.slice(0, -11) : e23, r17 ? i8 : "") : s14[t16] = e23;
          }
        }
        return T;
      }
    });
  }
});

// ../node_modules/lit/directives/style-map.js
var init_style_map2 = __esm({
  "../node_modules/lit/directives/style-map.js"() {
    init_style_map();
  }
});

// ../node_modules/lit-html/async-directive.js
function n10(i20) {
  void 0 !== this._$AN ? (o11(this), this._$AM = i20, r7(this)) : this._$AM = i20;
}
function h4(i20, t16 = false, e22 = 0) {
  const r16 = this._$AH, n18 = this._$AN;
  if (void 0 !== n18 && 0 !== n18.size) if (t16) if (Array.isArray(r16)) for (let i21 = e22; i21 < r16.length; i21++) s8(r16[i21], false), o11(r16[i21]);
  else null != r16 && (s8(r16, false), o11(r16));
  else s8(this, i20);
}
var s8, o11, r7, l8, c7;
var init_async_directive = __esm({
  "../node_modules/lit-html/async-directive.js"() {
    init_directive_helpers();
    init_directive();
    init_directive();
    s8 = (i20, t16) => {
      var e22, o26;
      const r16 = i20._$AN;
      if (void 0 === r16) return false;
      for (const i21 of r16) null === (o26 = (e22 = i21)._$AO) || void 0 === o26 || o26.call(e22, t16, false), s8(i21, t16);
      return true;
    };
    o11 = (i20) => {
      let t16, e22;
      do {
        if (void 0 === (t16 = i20._$AM)) break;
        e22 = t16._$AN, e22.delete(i20), i20 = t16;
      } while (0 === (null == e22 ? void 0 : e22.size));
    };
    r7 = (i20) => {
      for (let t16; t16 = i20._$AM; i20 = t16) {
        let e22 = t16._$AN;
        if (void 0 === e22) t16._$AN = e22 = /* @__PURE__ */ new Set();
        else if (e22.has(i20)) break;
        e22.add(i20), l8(t16);
      }
    };
    l8 = (i20) => {
      var t16, s14, o26, r16;
      i20.type == t5.CHILD && (null !== (t16 = (o26 = i20)._$AP) && void 0 !== t16 || (o26._$AP = h4), null !== (s14 = (r16 = i20)._$AQ) && void 0 !== s14 || (r16._$AQ = n10));
    };
    c7 = class extends i6 {
      constructor() {
        super(...arguments), this._$AN = void 0;
      }
      _$AT(i20, t16, e22) {
        super._$AT(i20, t16, e22), r7(this), this.isConnected = i20._$AU;
      }
      _$AO(i20, t16 = true) {
        var e22, r16;
        i20 !== this.isConnected && (this.isConnected = i20, i20 ? null === (e22 = this.reconnected) || void 0 === e22 || e22.call(this) : null === (r16 = this.disconnected) || void 0 === r16 || r16.call(this)), t16 && (s8(this, i20), o11(this));
      }
      setValue(t16) {
        if (e9(this._$Ct)) this._$Ct._$AI(t16, this);
        else {
          const i20 = [...this._$Ct._$AH];
          i20[this._$Ci] = t16, this._$Ct._$AI(i20, this, 0);
        }
      }
      disconnected() {
      }
      reconnected() {
      }
    };
  }
});

// ../node_modules/lit-html/directives/private-async-helpers.js
var s9, i9;
var init_private_async_helpers = __esm({
  "../node_modules/lit-html/directives/private-async-helpers.js"() {
    s9 = class {
      constructor(t16) {
        this.G = t16;
      }
      disconnect() {
        this.G = void 0;
      }
      reconnect(t16) {
        this.G = t16;
      }
      deref() {
        return this.G;
      }
    };
    i9 = class {
      constructor() {
        this.Y = void 0, this.Z = void 0;
      }
      get() {
        return this.Y;
      }
      pause() {
        var t16;
        null !== (t16 = this.Y) && void 0 !== t16 || (this.Y = new Promise((t17) => this.Z = t17));
      }
      resume() {
        var t16;
        null === (t16 = this.Z) || void 0 === t16 || t16.call(this), this.Y = this.Z = void 0;
      }
    };
  }
});

// ../node_modules/lit-html/directives/until.js
var n11, h5, c8, m4;
var init_until = __esm({
  "../node_modules/lit-html/directives/until.js"() {
    init_lit_html();
    init_directive_helpers();
    init_async_directive();
    init_private_async_helpers();
    init_directive();
    n11 = (t16) => !i7(t16) && "function" == typeof t16.then;
    h5 = 1073741823;
    c8 = class extends c7 {
      constructor() {
        super(...arguments), this._$C_t = h5, this._$Cwt = [], this._$Cq = new s9(this), this._$CK = new i9();
      }
      render(...s14) {
        var i20;
        return null !== (i20 = s14.find((t16) => !n11(t16))) && void 0 !== i20 ? i20 : T;
      }
      update(s14, i20) {
        const r16 = this._$Cwt;
        let e22 = r16.length;
        this._$Cwt = i20;
        const o26 = this._$Cq, c19 = this._$CK;
        this.isConnected || this.disconnected();
        for (let t16 = 0; t16 < i20.length && !(t16 > this._$C_t); t16++) {
          const s15 = i20[t16];
          if (!n11(s15)) return this._$C_t = t16, s15;
          t16 < e22 && s15 === r16[t16] || (this._$C_t = h5, e22 = 0, Promise.resolve(s15).then(async (t17) => {
            for (; c19.get(); ) await c19.get();
            const i21 = o26.deref();
            if (void 0 !== i21) {
              const r17 = i21._$Cwt.indexOf(s15);
              r17 > -1 && r17 < i21._$C_t && (i21._$C_t = r17, i21.setValue(t17));
            }
          }));
        }
        return T;
      }
      disconnected() {
        this._$Cq.disconnect(), this._$CK.pause();
      }
      reconnected() {
        this._$Cq.reconnect(this), this._$CK.resume();
      }
    };
    m4 = e8(c8);
  }
});

// ../node_modules/lit/directives/until.js
var init_until2 = __esm({
  "../node_modules/lit/directives/until.js"() {
    init_until();
  }
});

// ../node_modules/lit-html/directives/live.js
var l9;
var init_live = __esm({
  "../node_modules/lit-html/directives/live.js"() {
    init_lit_html();
    init_directive();
    init_directive_helpers();
    l9 = e8(class extends i6 {
      constructor(r16) {
        if (super(r16), r16.type !== t5.PROPERTY && r16.type !== t5.ATTRIBUTE && r16.type !== t5.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
        if (!e9(r16)) throw Error("`live` bindings can only contain a single expression");
      }
      render(r16) {
        return r16;
      }
      update(i20, [t16]) {
        if (t16 === T || t16 === A) return t16;
        const o26 = i20.element, l14 = i20.name;
        if (i20.type === t5.PROPERTY) {
          if (t16 === o26[l14]) return T;
        } else if (i20.type === t5.BOOLEAN_ATTRIBUTE) {
          if (!!t16 === o26.hasAttribute(l14)) return T;
        } else if (i20.type === t5.ATTRIBUTE && o26.getAttribute(l14) === t16 + "") return T;
        return a5(i20), t16;
      }
    });
  }
});

// ../node_modules/lit/directives/live.js
var init_live2 = __esm({
  "../node_modules/lit/directives/live.js"() {
    init_live();
  }
});

// ../node_modules/lit-html/directives/when.js
function n12(n18, o26, r16) {
  return n18 ? o26() : null == r16 ? void 0 : r16();
}
var init_when = __esm({
  "../node_modules/lit-html/directives/when.js"() {
  }
});

// ../node_modules/lit/directives/when.js
var init_when2 = __esm({
  "../node_modules/lit/directives/when.js"() {
    init_when();
  }
});

// ../node_modules/lit-html/directives/join.js
var init_join = __esm({
  "../node_modules/lit-html/directives/join.js"() {
  }
});

// ../node_modules/lit/directives/join.js
var init_join2 = __esm({
  "../node_modules/lit/directives/join.js"() {
    init_join();
  }
});

// ../node_modules/lit-html/directives/unsafe-html.js
var e10, o12;
var init_unsafe_html = __esm({
  "../node_modules/lit-html/directives/unsafe-html.js"() {
    init_lit_html();
    init_directive();
    e10 = class extends i6 {
      constructor(i20) {
        if (super(i20), this.et = A, i20.type !== t5.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
      }
      render(r16) {
        if (r16 === A || null == r16) return this.ft = void 0, this.et = r16;
        if (r16 === T) return r16;
        if ("string" != typeof r16) throw Error(this.constructor.directiveName + "() called with a non-string value");
        if (r16 === this.et) return this.ft;
        this.et = r16;
        const s14 = [r16];
        return s14.raw = s14, this.ft = { _$litType$: this.constructor.resultType, strings: s14, values: [] };
      }
    };
    e10.directiveName = "unsafeHTML", e10.resultType = 1;
    o12 = e8(e10);
  }
});

// ../node_modules/lit/directives/unsafe-html.js
var init_unsafe_html2 = __esm({
  "../node_modules/lit/directives/unsafe-html.js"() {
    init_unsafe_html();
  }
});

// ../node_modules/@spectrum-web-components/base/src/directives.js
var init_directives = __esm({
  "../node_modules/@spectrum-web-components/base/src/directives.js"() {
    "use strict";
    init_if_defined2();
    init_repeat2();
    init_class_map2();
    init_style_map2();
    init_until2();
    init_live2();
    init_when2();
    init_join2();
    init_unsafe_html2();
  }
});

// ../node_modules/@spectrum-web-components/shared/src/like-anchor.js
function LikeAnchor(s14) {
  class r16 extends s14 {
    renderAnchor({ id: i20, className: t16, ariaHidden: a10, labelledby: l14, tabindex: d13, anchorContent: g4 = x`<slot></slot>` }) {
      return x`<a
                    id=${i20}
                    class=${l6(t16)}
                    href=${l6(this.href)}
                    download=${l6(this.download)}
                    target=${l6(this.target)}
                    aria-label=${l6(this.label)}
                    aria-labelledby=${l6(l14)}
                    aria-hidden=${l6(a10 ? "true" : void 0)}
                    tabindex=${l6(d13)}
                    referrerpolicy=${l6(this.referrerpolicy)}
                    rel=${l6(this.rel)}
                >${g4}</a>`;
    }
  }
  return n13([n7()], r16.prototype, "download", 2), n13([n7()], r16.prototype, "label", 2), n13([n7()], r16.prototype, "href", 2), n13([n7()], r16.prototype, "target", 2), n13([n7()], r16.prototype, "referrerpolicy", 2), n13([n7()], r16.prototype, "rel", 2), r16;
}
var u6, f3, n13;
var init_like_anchor = __esm({
  "../node_modules/@spectrum-web-components/shared/src/like-anchor.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_directives();
    u6 = Object.defineProperty;
    f3 = Object.getOwnPropertyDescriptor;
    n13 = (s14, r16, p18, i20) => {
      for (var t16 = i20 > 1 ? void 0 : i20 ? f3(r16, p18) : r16, a10 = s14.length - 1, l14; a10 >= 0; a10--) (l14 = s14[a10]) && (t16 = (i20 ? l14(r16, p18, t16) : l14(t16)) || t16);
      return i20 && t16 && u6(r16, p18, t16), t16;
    };
  }
});

// ../node_modules/focus-visible/dist/focus-visible.js
var require_focus_visible = __commonJS({
  "../node_modules/focus-visible/dist/focus-visible.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory() : typeof define === "function" && define.amd ? define(factory) : factory();
    })(exports, function() {
      "use strict";
      function applyFocusVisiblePolyfill(scope) {
        var hadKeyboardEvent = true;
        var hadFocusVisibleRecently = false;
        var hadFocusVisibleRecentlyTimeout = null;
        var inputTypesAllowlist = {
          text: true,
          search: true,
          url: true,
          tel: true,
          email: true,
          password: true,
          number: true,
          date: true,
          month: true,
          week: true,
          time: true,
          datetime: true,
          "datetime-local": true
        };
        function isValidFocusTarget(el) {
          if (el && el !== document && el.nodeName !== "HTML" && el.nodeName !== "BODY" && "classList" in el && "contains" in el.classList) {
            return true;
          }
          return false;
        }
        function focusTriggersKeyboardModality(el) {
          var type = el.type;
          var tagName = el.tagName;
          if (tagName === "INPUT" && inputTypesAllowlist[type] && !el.readOnly) {
            return true;
          }
          if (tagName === "TEXTAREA" && !el.readOnly) {
            return true;
          }
          if (el.isContentEditable) {
            return true;
          }
          return false;
        }
        function addFocusVisibleClass(el) {
          if (el.classList.contains("focus-visible")) {
            return;
          }
          el.classList.add("focus-visible");
          el.setAttribute("data-focus-visible-added", "");
        }
        function removeFocusVisibleClass(el) {
          if (!el.hasAttribute("data-focus-visible-added")) {
            return;
          }
          el.classList.remove("focus-visible");
          el.removeAttribute("data-focus-visible-added");
        }
        function onKeyDown(e22) {
          if (e22.metaKey || e22.altKey || e22.ctrlKey) {
            return;
          }
          if (isValidFocusTarget(scope.activeElement)) {
            addFocusVisibleClass(scope.activeElement);
          }
          hadKeyboardEvent = true;
        }
        function onPointerDown(e22) {
          hadKeyboardEvent = false;
        }
        function onFocus(e22) {
          if (!isValidFocusTarget(e22.target)) {
            return;
          }
          if (hadKeyboardEvent || focusTriggersKeyboardModality(e22.target)) {
            addFocusVisibleClass(e22.target);
          }
        }
        function onBlur(e22) {
          if (!isValidFocusTarget(e22.target)) {
            return;
          }
          if (e22.target.classList.contains("focus-visible") || e22.target.hasAttribute("data-focus-visible-added")) {
            hadFocusVisibleRecently = true;
            window.clearTimeout(hadFocusVisibleRecentlyTimeout);
            hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
              hadFocusVisibleRecently = false;
            }, 100);
            removeFocusVisibleClass(e22.target);
          }
        }
        function onVisibilityChange(e22) {
          if (document.visibilityState === "hidden") {
            if (hadFocusVisibleRecently) {
              hadKeyboardEvent = true;
            }
            addInitialPointerMoveListeners();
          }
        }
        function addInitialPointerMoveListeners() {
          document.addEventListener("mousemove", onInitialPointerMove);
          document.addEventListener("mousedown", onInitialPointerMove);
          document.addEventListener("mouseup", onInitialPointerMove);
          document.addEventListener("pointermove", onInitialPointerMove);
          document.addEventListener("pointerdown", onInitialPointerMove);
          document.addEventListener("pointerup", onInitialPointerMove);
          document.addEventListener("touchmove", onInitialPointerMove);
          document.addEventListener("touchstart", onInitialPointerMove);
          document.addEventListener("touchend", onInitialPointerMove);
        }
        function removeInitialPointerMoveListeners() {
          document.removeEventListener("mousemove", onInitialPointerMove);
          document.removeEventListener("mousedown", onInitialPointerMove);
          document.removeEventListener("mouseup", onInitialPointerMove);
          document.removeEventListener("pointermove", onInitialPointerMove);
          document.removeEventListener("pointerdown", onInitialPointerMove);
          document.removeEventListener("pointerup", onInitialPointerMove);
          document.removeEventListener("touchmove", onInitialPointerMove);
          document.removeEventListener("touchstart", onInitialPointerMove);
          document.removeEventListener("touchend", onInitialPointerMove);
        }
        function onInitialPointerMove(e22) {
          if (e22.target.nodeName && e22.target.nodeName.toLowerCase() === "html") {
            return;
          }
          hadKeyboardEvent = false;
          removeInitialPointerMoveListeners();
        }
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("mousedown", onPointerDown, true);
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("touchstart", onPointerDown, true);
        document.addEventListener("visibilitychange", onVisibilityChange, true);
        addInitialPointerMoveListeners();
        scope.addEventListener("focus", onFocus, true);
        scope.addEventListener("blur", onBlur, true);
        if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
          scope.host.setAttribute("data-js-focus-visible", "");
        } else if (scope.nodeType === Node.DOCUMENT_NODE) {
          document.documentElement.classList.add("js-focus-visible");
          document.documentElement.setAttribute("data-js-focus-visible", "");
        }
      }
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;
        var event;
        try {
          event = new CustomEvent("focus-visible-polyfill-ready");
        } catch (error) {
          event = document.createEvent("CustomEvent");
          event.initCustomEvent("focus-visible-polyfill-ready", false, false, {});
        }
        window.dispatchEvent(event);
      }
      if (typeof document !== "undefined") {
        applyFocusVisiblePolyfill(document);
      }
    });
  }
});

// ../node_modules/@spectrum-web-components/shared/src/focus-visible.js
var i10, FocusVisiblePolyfillMixin;
var init_focus_visible = __esm({
  "../node_modules/@spectrum-web-components/shared/src/focus-visible.js"() {
    "use strict";
    i10 = true;
    try {
      document.body.querySelector(":focus-visible");
    } catch (a10) {
      i10 = false, Promise.resolve().then(() => __toESM(require_focus_visible(), 1));
    }
    FocusVisiblePolyfillMixin = (a10) => {
      var s14, t16;
      const n18 = (l14) => {
        if (l14.shadowRoot == null || l14.hasAttribute("data-js-focus-visible")) return () => {
        };
        if (self.applyFocusVisiblePolyfill) self.applyFocusVisiblePolyfill(l14.shadowRoot), l14.manageAutoFocus && l14.manageAutoFocus();
        else {
          const e22 = () => {
            self.applyFocusVisiblePolyfill && l14.shadowRoot && self.applyFocusVisiblePolyfill(l14.shadowRoot), l14.manageAutoFocus && l14.manageAutoFocus();
          };
          return self.addEventListener("focus-visible-polyfill-ready", e22, { once: true }), () => {
            self.removeEventListener("focus-visible-polyfill-ready", e22);
          };
        }
        return () => {
        };
      }, o26 = Symbol("endPolyfillCoordination");
      class c19 extends (t16 = a10, s14 = o26, t16) {
        constructor() {
          super(...arguments);
          this[s14] = null;
        }
        connectedCallback() {
          super.connectedCallback && super.connectedCallback(), i10 || requestAnimationFrame(() => {
            this[o26] == null && (this[o26] = n18(this));
          });
        }
        disconnectedCallback() {
          super.disconnectedCallback && super.disconnectedCallback(), i10 || requestAnimationFrame(() => {
            this[o26] != null && (this[o26](), this[o26] = null);
          });
        }
      }
      return c19;
    };
  }
});

// ../node_modules/@spectrum-web-components/shared/src/focusable.js
function u7() {
  return new Promise((s14) => requestAnimationFrame(() => s14()));
}
var d4, b2, n14, Focusable;
var init_focusable = __esm({
  "../node_modules/@spectrum-web-components/shared/src/focusable.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_focus_visible();
    d4 = Object.defineProperty;
    b2 = Object.getOwnPropertyDescriptor;
    n14 = (s14, a10, e22, t16) => {
      for (var i20 = t16 > 1 ? void 0 : t16 ? b2(a10, e22) : a10, o26 = s14.length - 1, r16; o26 >= 0; o26--) (r16 = s14[o26]) && (i20 = (t16 ? r16(a10, e22, i20) : r16(i20)) || i20);
      return t16 && i20 && d4(a10, e22, i20), i20;
    };
    Focusable = class extends FocusVisiblePolyfillMixin(SpectrumElement) {
      constructor() {
        super(...arguments);
        this.disabled = false;
        this.autofocus = false;
        this._tabIndex = 0;
        this.manipulatingTabindex = false;
        this.autofocusReady = Promise.resolve();
      }
      get tabIndex() {
        if (this.focusElement === this) {
          const t16 = this.hasAttribute("tabindex") ? Number(this.getAttribute("tabindex")) : NaN;
          return isNaN(t16) ? -1 : t16;
        }
        const e22 = parseFloat(this.hasAttribute("tabindex") && this.getAttribute("tabindex") || "0");
        return this.disabled || e22 < 0 ? -1 : this.focusElement ? this.focusElement.tabIndex : e22;
      }
      set tabIndex(e22) {
        if (this.manipulatingTabindex) {
          this.manipulatingTabindex = false;
          return;
        }
        if (this.focusElement === this) {
          if (e22 !== this._tabIndex) {
            this._tabIndex = e22;
            const t16 = this.disabled ? "-1" : "" + e22;
            this.manipulatingTabindex = true, this.setAttribute("tabindex", t16);
          }
          return;
        }
        if (e22 === -1 ? this.addEventListener("pointerdown", this.onPointerdownManagementOfTabIndex) : (this.manipulatingTabindex = true, this.removeEventListener("pointerdown", this.onPointerdownManagementOfTabIndex)), e22 === -1 || this.disabled) {
          this.setAttribute("tabindex", "-1"), this.removeAttribute("focusable"), e22 !== -1 && this.manageFocusElementTabindex(e22);
          return;
        }
        this.setAttribute("focusable", ""), this.hasAttribute("tabindex") ? this.removeAttribute("tabindex") : this.manipulatingTabindex = false, this.manageFocusElementTabindex(e22);
      }
      onPointerdownManagementOfTabIndex() {
        this.tabIndex === -1 && setTimeout(() => {
          this.tabIndex = 0, this.focus({ preventScroll: true }), this.tabIndex = -1;
        });
      }
      async manageFocusElementTabindex(e22) {
        this.focusElement || await this.updateComplete, e22 === null ? this.focusElement.removeAttribute("tabindex") : this.focusElement.tabIndex = e22;
      }
      get focusElement() {
        throw new Error("Must implement focusElement getter!");
      }
      focus(e22) {
        this.disabled || !this.focusElement || (this.focusElement !== this ? this.focusElement.focus(e22) : HTMLElement.prototype.focus.apply(this, [e22]));
      }
      blur() {
        const e22 = this.focusElement || this;
        e22 !== this ? e22.blur() : HTMLElement.prototype.blur.apply(this);
      }
      click() {
        if (this.disabled) return;
        const e22 = this.focusElement || this;
        e22 !== this ? e22.click() : HTMLElement.prototype.click.apply(this);
      }
      manageAutoFocus() {
        this.autofocus && (this.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab" })), this.focusElement.focus());
      }
      firstUpdated(e22) {
        super.firstUpdated(e22), (!this.hasAttribute("tabindex") || this.getAttribute("tabindex") !== "-1") && this.setAttribute("focusable", "");
      }
      update(e22) {
        e22.has("disabled") && this.handleDisabledChanged(this.disabled, e22.get("disabled")), super.update(e22);
      }
      updated(e22) {
        super.updated(e22), e22.has("disabled") && this.disabled && this.blur();
      }
      async handleDisabledChanged(e22, t16) {
        const i20 = () => this.focusElement !== this && typeof this.focusElement.disabled != "undefined";
        e22 ? (this.manipulatingTabindex = true, this.setAttribute("tabindex", "-1"), await this.updateComplete, i20() ? this.focusElement.disabled = true : this.setAttribute("aria-disabled", "true")) : t16 && (this.manipulatingTabindex = true, this.focusElement === this ? this.setAttribute("tabindex", "" + this._tabIndex) : this.removeAttribute("tabindex"), await this.updateComplete, i20() ? this.focusElement.disabled = false : this.removeAttribute("aria-disabled"));
      }
      async getUpdateComplete() {
        const e22 = await super.getUpdateComplete();
        return await this.autofocusReady, e22;
      }
      connectedCallback() {
        super.connectedCallback(), this.autofocus && (this.autofocusReady = new Promise(async (e22) => {
          await u7(), await u7(), e22();
        }), this.updateComplete.then(() => {
          this.manageAutoFocus();
        }));
      }
    };
    n14([n7({ type: Boolean, reflect: true })], Focusable.prototype, "disabled", 2), n14([n7({ type: Boolean })], Focusable.prototype, "autofocus", 2), n14([n7({ type: Number })], Focusable.prototype, "tabIndex", 1);
  }
});

// ../node_modules/@lit-labs/observers/mutation-controller.js
var t6;
var init_mutation_controller = __esm({
  "../node_modules/@lit-labs/observers/mutation-controller.js"() {
    t6 = class {
      constructor(t16, { target: s14, config: i20, callback: h11, skipInitial: o26 }) {
        this.t = /* @__PURE__ */ new Set(), this.o = false, this.i = false, this.h = t16, null !== s14 && this.t.add(s14 ?? t16), this.l = i20, this.o = o26 ?? this.o, this.callback = h11, window.MutationObserver ? (this.u = new MutationObserver((t17) => {
          this.handleChanges(t17), this.h.requestUpdate();
        }), t16.addController(this)) : console.warn("MutationController error: browser does not support MutationObserver.");
      }
      handleChanges(t16) {
        this.value = this.callback?.(t16, this.u);
      }
      hostConnected() {
        for (const t16 of this.t) this.observe(t16);
      }
      hostDisconnected() {
        this.disconnect();
      }
      async hostUpdated() {
        const t16 = this.u.takeRecords();
        (t16.length || !this.o && this.i) && this.handleChanges(t16), this.i = false;
      }
      observe(t16) {
        this.t.add(t16), this.u.observe(t16, this.l), this.i = true, this.h.requestUpdate();
      }
      disconnect() {
        this.u.disconnect();
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/shared/src/observe-slot-text.js
function ObserveSlotText(c19, e22, s14 = []) {
  var a10, i20;
  const o26 = (f8) => (m10) => f8.matches(m10);
  class t16 extends (i20 = c19, a10 = p4, i20) {
    constructor(...n18) {
      super(n18);
      this.slotHasContent = false;
      new t6(this, { config: { characterData: true, subtree: true }, callback: (d13) => {
        for (const r16 of d13) if (r16.type === "characterData") {
          this.manageTextObservedSlot();
          return;
        }
      } });
    }
    manageTextObservedSlot() {
      if (!this[p4]) return;
      const n18 = [...this[p4]].filter((d13) => {
        const r16 = d13;
        return r16.tagName ? !s14.some(o26(r16)) : r16.textContent ? r16.textContent.trim() : false;
      });
      this.slotHasContent = n18.length > 0;
    }
    update(n18) {
      if (!this.hasUpdated) {
        const { childNodes: d13 } = this, r16 = [...d13].filter((g4) => {
          const l14 = g4;
          return l14.tagName ? s14.some(o26(l14)) ? false : e22 ? l14.getAttribute("slot") === e22 : !l14.hasAttribute("slot") : l14.textContent ? l14.textContent.trim() : false;
        });
        this.slotHasContent = r16.length > 0;
      }
      super.update(n18);
    }
    firstUpdated(n18) {
      super.firstUpdated(n18), this.updateComplete.then(() => {
        this.manageTextObservedSlot();
      });
    }
  }
  return u8([n7({ type: Boolean, attribute: false })], t16.prototype, "slotHasContent", 2), u8([o8({ slot: e22, flatten: true })], t16.prototype, a10, 2), t16;
}
var h6, x2, u8, p4;
var init_observe_slot_text = __esm({
  "../node_modules/@spectrum-web-components/shared/src/observe-slot-text.js"() {
    "use strict";
    init_decorators2();
    init_mutation_controller();
    h6 = Object.defineProperty;
    x2 = Object.getOwnPropertyDescriptor;
    u8 = (c19, e22, s14, o26) => {
      for (var t16 = o26 > 1 ? void 0 : o26 ? x2(e22, s14) : e22, a10 = c19.length - 1, i20; a10 >= 0; a10--) (i20 = c19[a10]) && (t16 = (o26 ? i20(e22, s14, t16) : i20(t16)) || t16);
      return o26 && t16 && h6(e22, s14, t16), t16;
    };
    p4 = Symbol("assignedNodes");
  }
});

// ../node_modules/@spectrum-web-components/shared/src/get-label-from-slot.js
var getLabelFromSlot;
var init_get_label_from_slot = __esm({
  "../node_modules/@spectrum-web-components/shared/src/get-label-from-slot.js"() {
    "use strict";
    getLabelFromSlot = (r16, l14) => {
      if (r16) return null;
      const t16 = l14.assignedNodes().reduce((e22, n18) => n18.textContent ? e22 + n18.textContent : e22, "");
      return t16 ? t16.trim() : null;
    };
  }
});

// ../node_modules/@spectrum-web-components/progress-circle/src/progress-circle.css.js
var e12, progress_circle_css_default;
var init_progress_circle_css = __esm({
  "../node_modules/@spectrum-web-components/progress-circle/src/progress-circle.css.js"() {
    "use strict";
    init_src();
    e12 = i3`
    .fill-submask-2{animation:1s linear infinite b}@keyframes a{0%{transform:rotate(90deg)}1.69%{transform:rotate(72.3deg)}3.39%{transform:rotate(55.5deg)}5.08%{transform:rotate(40.3deg)}6.78%{transform:rotate(25deg)}8.47%{transform:rotate(10.6deg)}10.17%{transform:rotate(0)}11.86%{transform:rotate(0)}13.56%{transform:rotate(0)}15.25%{transform:rotate(0)}16.95%{transform:rotate(0)}18.64%{transform:rotate(0)}20.34%{transform:rotate(0)}22.03%{transform:rotate(0)}23.73%{transform:rotate(0)}25.42%{transform:rotate(0)}27.12%{transform:rotate(0)}28.81%{transform:rotate(0)}30.51%{transform:rotate(0)}32.2%{transform:rotate(0)}33.9%{transform:rotate(0)}35.59%{transform:rotate(0)}37.29%{transform:rotate(0)}38.98%{transform:rotate(0)}40.68%{transform:rotate(0)}42.37%{transform:rotate(5.3deg)}44.07%{transform:rotate(13.4deg)}45.76%{transform:rotate(20.6deg)}47.46%{transform:rotate(29deg)}49.15%{transform:rotate(36.5deg)}50.85%{transform:rotate(42.6deg)}52.54%{transform:rotate(48.8deg)}54.24%{transform:rotate(54.2deg)}55.93%{transform:rotate(59.4deg)}57.63%{transform:rotate(63.2deg)}59.32%{transform:rotate(67.2deg)}61.02%{transform:rotate(70.8deg)}62.71%{transform:rotate(73.8deg)}64.41%{transform:rotate(76.2deg)}66.1%{transform:rotate(78.7deg)}67.8%{transform:rotate(80.6deg)}69.49%{transform:rotate(82.6deg)}71.19%{transform:rotate(83.7deg)}72.88%{transform:rotate(85deg)}74.58%{transform:rotate(86.3deg)}76.27%{transform:rotate(87deg)}77.97%{transform:rotate(87.7deg)}79.66%{transform:rotate(88.3deg)}81.36%{transform:rotate(88.6deg)}83.05%{transform:rotate(89.2deg)}84.75%{transform:rotate(89.2deg)}86.44%{transform:rotate(89.5deg)}88.14%{transform:rotate(89.9deg)}89.83%{transform:rotate(89.7deg)}91.53%{transform:rotate(90.1deg)}93.22%{transform:rotate(90.2deg)}94.92%{transform:rotate(90.1deg)}96.61%{transform:rotate(90deg)}98.31%{transform:rotate(89.8deg)}to{transform:rotate(90deg)}}@keyframes b{0%{transform:rotate(180deg)}1.69%{transform:rotate(180deg)}3.39%{transform:rotate(180deg)}5.08%{transform:rotate(180deg)}6.78%{transform:rotate(180deg)}8.47%{transform:rotate(180deg)}10.17%{transform:rotate(179.2deg)}11.86%{transform:rotate(164deg)}13.56%{transform:rotate(151.8deg)}15.25%{transform:rotate(140.8deg)}16.95%{transform:rotate(130.3deg)}18.64%{transform:rotate(120.4deg)}20.34%{transform:rotate(110.8deg)}22.03%{transform:rotate(101.6deg)}23.73%{transform:rotate(93.5deg)}25.42%{transform:rotate(85.4deg)}27.12%{transform:rotate(78.1deg)}28.81%{transform:rotate(71.2deg)}30.51%{transform:rotate(89.1deg)}32.2%{transform:rotate(105.5deg)}33.9%{transform:rotate(121.3deg)}35.59%{transform:rotate(135.5deg)}37.29%{transform:rotate(148.4deg)}38.98%{transform:rotate(161deg)}40.68%{transform:rotate(173.5deg)}42.37%{transform:rotate(180deg)}44.07%{transform:rotate(180deg)}45.76%{transform:rotate(180deg)}47.46%{transform:rotate(180deg)}49.15%{transform:rotate(180deg)}50.85%{transform:rotate(180deg)}52.54%{transform:rotate(180deg)}54.24%{transform:rotate(180deg)}55.93%{transform:rotate(180deg)}57.63%{transform:rotate(180deg)}59.32%{transform:rotate(180deg)}61.02%{transform:rotate(180deg)}62.71%{transform:rotate(180deg)}64.41%{transform:rotate(180deg)}66.1%{transform:rotate(180deg)}67.8%{transform:rotate(180deg)}69.49%{transform:rotate(180deg)}71.19%{transform:rotate(180deg)}72.88%{transform:rotate(180deg)}74.58%{transform:rotate(180deg)}76.27%{transform:rotate(180deg)}77.97%{transform:rotate(180deg)}79.66%{transform:rotate(180deg)}81.36%{transform:rotate(180deg)}83.05%{transform:rotate(180deg)}84.75%{transform:rotate(180deg)}86.44%{transform:rotate(180deg)}88.14%{transform:rotate(180deg)}89.83%{transform:rotate(180deg)}91.53%{transform:rotate(180deg)}93.22%{transform:rotate(180deg)}94.92%{transform:rotate(180deg)}96.61%{transform:rotate(180deg)}98.31%{transform:rotate(180deg)}to{transform:rotate(180deg)}}@keyframes c{0%{transform:rotate(-90deg)}to{transform:rotate(270deg)}}:host{--spectrum-progress-circle-track-border-color:var(--spectrum-gray-300);--spectrum-progress-circle-fill-border-color:var(--spectrum-accent-content-color-default);--spectrum-progress-circle-track-border-color-over-background:var(--spectrum-transparent-white-300);--spectrum-progress-circle-fill-border-color-over-background:var(--spectrum-transparent-white-900);--spectrum-progress-circle-size:var(--spectrum-progress-circle-size-medium);--spectrum-progress-circle-thickness:var(--spectrum-progress-circle-thickness-medium);--spectrum-progress-circle-track-border-style:solid}:host([size=s]){--spectrum-progress-circle-size:var(--spectrum-progress-circle-size-small);--spectrum-progress-circle-thickness:var(--spectrum-progress-circle-thickness-small)}:host([size=l]){--spectrum-progress-circle-size:var(--spectrum-progress-circle-size-large);--spectrum-progress-circle-thickness:var(--spectrum-progress-circle-thickness-large)}@media (forced-colors:active){:host{--highcontrast-progress-circle-fill-border-color:Highlight;--highcontrast-progress-circle-fill-border-color-over-background:Highlight}.track{--spectrum-progress-circle-track-border-style:double}}:host{position:var(--mod-progress-circle-position,relative);direction:ltr;display:inline-block;transform:translateZ(0)}:host,.track{inline-size:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size));block-size:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size))}.track{box-sizing:border-box;border-style:var(--highcontrast-progress-circle-track-border-style,var(--mod-progress-circle-track-border-style,var(--spectrum-progress-circle-track-border-style)));border-width:var(--mod-progress-circle-thickness,var(--spectrum-progress-circle-thickness));border-radius:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size));border-color:var(--mod-progress-circle-track-border-color,var(--spectrum-progress-circle-track-border-color))}.fills{block-size:100%;inline-size:100%;position:absolute;inset-block-start:0;inset-inline-start:0}.fill{box-sizing:border-box;inline-size:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size));block-size:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size));border-style:solid;border-width:var(--mod-progress-circle-thickness,var(--spectrum-progress-circle-thickness));border-radius:var(--mod-progress-circle-size,var(--spectrum-progress-circle-size));border-color:var(--highcontrast-progress-circle-fill-border-color,var(--mod-progress-circle-fill-border-color,var(--spectrum-progress-circle-fill-border-color)))}:host([static=white]) .track{border-color:var(--mod-progress-circle-track-border-color-over-background,var(--spectrum-progress-circle-track-border-color-over-background))}:host([static=white]) .fill{border-color:var(--highcontrast-progress-circle-fill-border-color-over-background,var(--mod-progress-circle-fill-border-color-over-background,var(--spectrum-progress-circle-fill-border-color-over-background)))}.fillMask1,.fillMask2{transform-origin:100%;block-size:100%;inline-size:50%;position:absolute;overflow:hidden;transform:rotate(180deg)}.fillSubMask1,.fillSubMask2{transform-origin:100%;block-size:100%;inline-size:100%;overflow:hidden;transform:rotate(-180deg)}.fillMask2{transform:rotate(0)}:host([indeterminate]) .fills{will-change:transform;transform-origin:50%;animation:1s cubic-bezier(.25,.78,.48,.89) infinite c;transform:translateZ(0)}:host([indeterminate]) .fillSubMask1{will-change:transform;animation:1s linear infinite a;transform:translateZ(0)}:host([indeterminate]) .fillSubMask2{will-change:transform;animation:1s linear infinite b;transform:translateZ(0)}:host{block-size:var(--mod-progress-circle-size,var(--_spectrum-progress-circle-size));inline-size:var(--mod-progress-circle-size,var(--_spectrum-progress-circle-size));--spectrum-progress-circle-size:inherit;--spectrum-progresscircle-m-over-background-track-fill-color:var(--spectrum-alias-track-fill-color-overbackground);--_spectrum-progress-circle-size:var(--spectrum-progress-circle-size,var(--spectrum-progress-circle-size-medium))}:host([size=s]){--_spectrum-progress-circle-size:var(--spectrum-progress-circle-size,var(--spectrum-progress-circle-size-small))}:host([size=l]){--_spectrum-progress-circle-size:var(--spectrum-progress-circle-size,var(--spectrum-progress-circle-size-large))}slot{display:none}.track,.fill{block-size:var(--mod-progress-circle-size,var(--_spectrum-progress-circle-size));border-radius:var(--mod-progress-circle-size,var(--_spectrum-progress-circle-size));inline-size:var(--mod-progress-circle-size,var(--_spectrum-progress-circle-size))}:host([indeterminate]) .fills,:host([indeterminate]) .fillSubMask1,:host([indeterminate]) .fillSubMask2{animation-duration:var(--spectrum-animation-duration-2000)}
`;
    progress_circle_css_default = e12;
  }
});

// ../node_modules/@spectrum-web-components/progress-circle/src/ProgressCircle.js
var p5, c10, i11, ProgressCircle;
var init_ProgressCircle = __esm({
  "../node_modules/@spectrum-web-components/progress-circle/src/ProgressCircle.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_get_label_from_slot();
    init_directives();
    init_progress_circle_css();
    p5 = Object.defineProperty;
    c10 = Object.getOwnPropertyDescriptor;
    i11 = (o26, s14, e22, r16) => {
      for (var t16 = r16 > 1 ? void 0 : r16 ? c10(s14, e22) : s14, l14 = o26.length - 1, n18; l14 >= 0; l14--) (n18 = o26[l14]) && (t16 = (r16 ? n18(s14, e22, t16) : n18(t16)) || t16);
      return r16 && t16 && p5(s14, e22, t16), t16;
    };
    ProgressCircle = class extends SizedMixin(SpectrumElement, { validSizes: ["s", "m", "l"] }) {
      constructor() {
        super(...arguments);
        this.indeterminate = false;
        this.label = "";
        this.overBackground = false;
        this.progress = 0;
      }
      static get styles() {
        return [progress_circle_css_default];
      }
      makeRotation(e22) {
        return this.indeterminate ? void 0 : `transform: rotate(${e22}deg);`;
      }
      willUpdate(e22) {
        e22.has("overBackground") && (this.static = this.overBackground ? "white" : this.static || void 0);
      }
      render() {
        const e22 = [this.makeRotation(-180 + 3.6 * Math.min(this.progress, 50)), this.makeRotation(-180 + 3.6 * Math.max(this.progress - 50, 0))], r16 = ["Mask1", "Mask2"];
        return x`
            <slot @slotchange=${this.handleSlotchange}></slot>
            <div class="track"></div>
            <div class="fills">
                ${r16.map((t16, l14) => x`
                        <div class="fill${t16}">
                            <div
                                class="fillSub${t16}"
                                style=${l6(e22[l14])}
                            >
                                <div class="fill"></div>
                            </div>
                        </div>
                    `)}
            </div>
        `;
      }
      handleSlotchange() {
        const e22 = getLabelFromSlot(this.label, this.slotEl);
        e22 && (this.label = e22);
      }
      firstUpdated(e22) {
        super.firstUpdated(e22), this.hasAttribute("role") || this.setAttribute("role", "progressbar");
      }
      updated(e22) {
        super.updated(e22), !this.indeterminate && e22.has("progress") ? this.setAttribute("aria-valuenow", "" + this.progress) : this.hasAttribute("aria-valuenow") && this.removeAttribute("aria-valuenow"), e22.has("label") && (this.label.length ? this.setAttribute("aria-label", this.label) : e22.get("label") === this.getAttribute("aria-label") && this.removeAttribute("aria-label"));
      }
    };
    i11([n7({ type: Boolean, reflect: true })], ProgressCircle.prototype, "indeterminate", 2), i11([n7({ type: String })], ProgressCircle.prototype, "label", 2), i11([n7({ type: Boolean, reflect: true, attribute: "over-background" })], ProgressCircle.prototype, "overBackground", 2), i11([n7({ reflect: true })], ProgressCircle.prototype, "static", 2), i11([n7({ type: Number })], ProgressCircle.prototype, "progress", 2), i11([i5("slot")], ProgressCircle.prototype, "slotEl", 2);
  }
});

// ../node_modules/@spectrum-web-components/base/src/define-element.js
function defineElement(e22, n18) {
  window.__swc, customElements.define(e22, n18);
}
var init_define_element = __esm({
  "../node_modules/@spectrum-web-components/base/src/define-element.js"() {
    "use strict";
  }
});

// ../node_modules/@spectrum-web-components/progress-circle/sp-progress-circle.js
var sp_progress_circle_exports = {};
var init_sp_progress_circle = __esm({
  "../node_modules/@spectrum-web-components/progress-circle/sp-progress-circle.js"() {
    "use strict";
    init_ProgressCircle();
    init_define_element();
    defineElement("sp-progress-circle", ProgressCircle);
  }
});

// ../node_modules/@spectrum-web-components/shared/src/focusable-selectors.js
var e14, o17, userFocusableSelector, focusableSelector;
var init_focusable_selectors = __esm({
  "../node_modules/@spectrum-web-components/shared/src/focusable-selectors.js"() {
    "use strict";
    e14 = ["button", "[focusable]", "[href]", "input", "label", "select", "textarea", "[tabindex]"];
    o17 = ':not([tabindex="-1"])';
    userFocusableSelector = e14.join(`${o17}, `) + o17;
    focusableSelector = e14.join(", ");
  }
});

// ../node_modules/@spectrum-web-components/shared/src/first-focusable-in.js
var firstFocusableIn, firstFocusableSlottedIn;
var init_first_focusable_in = __esm({
  "../node_modules/@spectrum-web-components/shared/src/first-focusable-in.js"() {
    "use strict";
    init_focusable_selectors();
    firstFocusableIn = (e22) => e22.querySelector(userFocusableSelector);
    firstFocusableSlottedIn = (e22) => e22.assignedElements().find((o26) => o26.matches(userFocusableSelector));
  }
});

// ../node_modules/@spectrum-web-components/shared/src/get-active-element.js
var init_get_active_element = __esm({
  "../node_modules/@spectrum-web-components/shared/src/get-active-element.js"() {
    "use strict";
  }
});

// ../node_modules/@spectrum-web-components/shared/src/observe-slot-presence.js
function ObserveSlotPresence(l14, s14) {
  var o26, i20;
  const r16 = Array.isArray(s14) ? s14 : [s14];
  class a10 extends (i20 = l14, o26 = t10, i20) {
    constructor(...e22) {
      super(e22);
      this[o26] = /* @__PURE__ */ new Map();
      this.managePresenceObservedSlot = () => {
        let e23 = false;
        r16.forEach((n18) => {
          const c19 = !!this.querySelector(`:scope > ${n18}`), g4 = this[t10].get(n18) || false;
          e23 = e23 || g4 !== c19, this[t10].set(n18, !!this.querySelector(`:scope > ${n18}`));
        }), e23 && this.updateComplete.then(() => {
          this.requestUpdate();
        });
      };
      new t6(this, { config: { childList: true, subtree: true }, callback: () => {
        this.managePresenceObservedSlot();
      } }), this.managePresenceObservedSlot();
    }
    get slotContentIsPresent() {
      if (r16.length === 1) return this[t10].get(r16[0]) || false;
      throw new Error("Multiple selectors provided to `ObserveSlotPresence` use `getSlotContentPresence(selector: string)` instead.");
    }
    getSlotContentPresence(e22) {
      if (this[t10].has(e22)) return this[t10].get(e22) || false;
      throw new Error(`The provided selector \`${e22}\` is not being observed.`);
    }
  }
  return a10;
}
var t10;
var init_observe_slot_presence = __esm({
  "../node_modules/@spectrum-web-components/shared/src/observe-slot-presence.js"() {
    "use strict";
    init_mutation_controller();
    t10 = Symbol("slotContentIsPresent");
  }
});

// ../node_modules/@spectrum-web-components/shared/src/platform.js
function n15(o26) {
  return typeof window != "undefined" && window.navigator != null ? o26.test(window.navigator.userAgent) : false;
}
function e15(o26) {
  return typeof window != "undefined" && window.navigator != null ? o26.test(window.navigator.platform) : false;
}
function isMac() {
  return e15(/^Mac/);
}
function isIPhone() {
  return e15(/^iPhone/);
}
function isIPad() {
  return e15(/^iPad/) || isMac() && navigator.maxTouchPoints > 1;
}
function isIOS() {
  return isIPhone() || isIPad();
}
function isAndroid() {
  return n15(/Android/);
}
var init_platform = __esm({
  "../node_modules/@spectrum-web-components/shared/src/platform.js"() {
    "use strict";
  }
});

// ../node_modules/@spectrum-web-components/shared/src/reparent-children.js
function T2(o26, i20, l14 = []) {
  for (let e22 = 0; e22 < i20.length; ++e22) {
    const n18 = i20[e22], r16 = o26[e22], t16 = r16.parentElement || r16.getRootNode();
    l14[e22] && l14[e22](n18), t16 && t16 !== r16 && t16.replaceChild(n18, r16), delete o26[e22];
  }
  return i20;
}
var reparentChildren;
var init_reparent_children = __esm({
  "../node_modules/@spectrum-web-components/shared/src/reparent-children.js"() {
    "use strict";
    reparentChildren = (o26, i20, { position: l14, prepareCallback: e22 } = { position: "beforeend" }) => {
      let { length: n18 } = o26;
      if (n18 === 0) return () => o26;
      let r16 = 1, t16 = 0;
      (l14 === "afterbegin" || l14 === "afterend") && (r16 = -1, t16 = n18 - 1);
      const a10 = new Array(n18), c19 = new Array(n18), p18 = document.createComment("placeholder for reparented element");
      do {
        const d13 = o26[t16];
        e22 && (c19[t16] = e22(d13)), a10[t16] = p18.cloneNode();
        const m10 = d13.parentElement || d13.getRootNode();
        m10 && m10 !== d13 && m10.replaceChild(a10[t16], d13), i20.insertAdjacentElement(l14, d13), t16 += r16;
      } while (--n18 > 0);
      return function() {
        return T2(a10, o26, c19);
      };
    };
  }
});

// ../node_modules/@spectrum-web-components/shared/src/random-id.js
function randomID() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)), (r16) => `0${(r16 & 255).toString(16)}`.slice(-2)).join("");
}
var init_random_id = __esm({
  "../node_modules/@spectrum-web-components/shared/src/random-id.js"() {
    "use strict";
  }
});

// ../node_modules/@spectrum-web-components/shared/src/index.js
var init_src2 = __esm({
  "../node_modules/@spectrum-web-components/shared/src/index.js"() {
    "use strict";
    init_first_focusable_in();
    init_focus_visible();
    init_focusable();
    init_focusable_selectors();
    init_get_active_element();
    init_like_anchor();
    init_observe_slot_presence();
    init_observe_slot_text();
    init_platform();
    init_reparent_children();
    init_get_label_from_slot();
    init_random_id();
  }
});

// ../node_modules/@spectrum-web-components/base/src/condition-attribute-with-id.js
function conditionAttributeWithoutId(t16, i20, n18) {
  const e22 = t16.getAttribute(i20);
  let r16 = e22 ? e22.split(/\s+/) : [];
  r16 = r16.filter((s14) => !n18.find((o26) => s14 === o26)), r16.length ? t16.setAttribute(i20, r16.join(" ")) : t16.removeAttribute(i20);
}
function conditionAttributeWithId(t16, i20, n18) {
  const e22 = Array.isArray(n18) ? n18 : [n18], r16 = t16.getAttribute(i20), s14 = r16 ? r16.split(/\s+/) : [];
  return e22.every((d13) => s14.indexOf(d13) > -1) ? () => {
  } : (s14.push(...e22), t16.setAttribute(i20, s14.join(" ")), () => conditionAttributeWithoutId(t16, i20, e22));
}
var init_condition_attribute_with_id = __esm({
  "../node_modules/@spectrum-web-components/base/src/condition-attribute-with-id.js"() {
    "use strict";
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/slottable-request-event.js
var SlottableRequestEvent, removeSlottableRequest;
var init_slottable_request_event = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/slottable-request-event.js"() {
    "use strict";
    SlottableRequestEvent = class extends Event {
      constructor(e22, n18, t16) {
        super("slottable-request", { bubbles: false, cancelable: true, composed: false }), this.name = e22, this.data = n18, this.slotName = t16 !== void 0 ? `${e22}.${t16}` : e22;
      }
    };
    removeSlottableRequest = Symbol("remove-slottable-request");
  }
});

// ../node_modules/@spectrum-web-components/reactive-controllers/src/ElementResolution.js
var elementResolverUpdatedSymbol, ElementResolutionController;
var init_ElementResolution = __esm({
  "../node_modules/@spectrum-web-components/reactive-controllers/src/ElementResolution.js"() {
    "use strict";
    elementResolverUpdatedSymbol = Symbol("element resolver updated");
    ElementResolutionController = class {
      constructor(e22, { selector: t16 } = { selector: "" }) {
        this._element = null;
        this._selector = "";
        this.mutationCallback = (e23) => {
          let t17 = false;
          e23.forEach((s14) => {
            if (!t17) {
              if (s14.type === "childList") {
                const r16 = this.element && [...s14.removedNodes].includes(this.element), l14 = !!this.selector && [...s14.addedNodes].some(this.elementIsSelected);
                t17 = t17 || r16 || l14;
              }
              if (s14.type === "attributes") {
                const r16 = s14.target === this.element, l14 = !!this.selector && this.elementIsSelected(s14.target);
                t17 = t17 || r16 || l14;
              }
            }
          }), t17 && this.resolveElement();
        };
        this.elementIsSelected = (e23) => {
          var t17;
          return this.selectorIsId ? (e23 == null ? void 0 : e23.id) === this.selectorAsId : (t17 = e23 == null ? void 0 : e23.matches) == null ? void 0 : t17.call(e23, this.selector);
        };
        this.host = e22, this.selector = t16, this.observer = new MutationObserver(this.mutationCallback), this.host.addController(this);
      }
      get element() {
        return this._element;
      }
      set element(e22) {
        if (e22 === this.element) return;
        const t16 = this.element;
        this._element = e22, this.host.requestUpdate(elementResolverUpdatedSymbol, t16);
      }
      get selector() {
        return this._selector;
      }
      set selector(e22) {
        e22 !== this.selector && (this.releaseElement(), this._selector = e22, this.resolveElement());
      }
      get selectorAsId() {
        return this.selector.slice(1);
      }
      get selectorIsId() {
        return !!this.selector && this.selector.startsWith("#");
      }
      hostConnected() {
        this.resolveElement(), this.observer.observe(this.host.getRootNode(), { subtree: true, childList: true, attributes: true });
      }
      hostDisconnected() {
        this.releaseElement(), this.observer.disconnect();
      }
      resolveElement() {
        if (!this.selector) {
          this.releaseElement();
          return;
        }
        const e22 = this.host.getRootNode();
        this.element = this.selectorIsId ? e22.getElementById(this.selectorAsId) : e22.querySelector(this.selector);
      }
      releaseElement() {
        this.element = null;
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/overlay-timer.js
var OverlayTimer;
var init_overlay_timer = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/overlay-timer.js"() {
    "use strict";
    OverlayTimer = class {
      constructor(e22 = {}) {
        this.warmUpDelay = 1e3;
        this.coolDownDelay = 1e3;
        this.isWarm = false;
        this.timeout = 0;
        Object.assign(this, e22);
      }
      async openTimer(e22) {
        if (this.cancelCooldownTimer(), !this.component || e22 !== this.component) return this.component && (this.close(this.component), this.cancelCooldownTimer()), this.component = e22, this.isWarm ? false : (this.promise = new Promise((o26) => {
          this.resolve = o26, this.timeout = window.setTimeout(() => {
            this.resolve && (this.resolve(false), this.isWarm = true);
          }, this.warmUpDelay);
        }), this.promise);
        if (this.promise) return this.promise;
        throw new Error("Inconsistent state");
      }
      close(e22) {
        this.component && this.component === e22 && (this.resetCooldownTimer(), this.timeout > 0 && (clearTimeout(this.timeout), this.timeout = 0), this.resolve && (this.resolve(true), delete this.resolve), delete this.promise, delete this.component);
      }
      resetCooldownTimer() {
        this.isWarm && (this.cooldownTimeout && window.clearTimeout(this.cooldownTimeout), this.cooldownTimeout = window.setTimeout(() => {
          this.isWarm = false, delete this.cooldownTimeout;
        }, this.coolDownDelay));
      }
      cancelCooldownTimer() {
        this.cooldownTimeout && window.clearTimeout(this.cooldownTimeout), delete this.cooldownTimeout;
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/AbstractOverlay.js
function nextFrame() {
  return new Promise((i20) => requestAnimationFrame(() => i20()));
}
var overlayTimer, noop, guaranteedAllTransitionend, AbstractOverlay;
var init_AbstractOverlay = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/AbstractOverlay.js"() {
    "use strict";
    init_src();
    init_reparent_children();
    init_overlay_timer();
    overlayTimer = new OverlayTimer();
    noop = () => {
    };
    guaranteedAllTransitionend = (i20, v3, e22) => {
      const r16 = new AbortController(), n18 = /* @__PURE__ */ new Map(), a10 = () => {
        r16.abort(), e22();
      };
      let m10, l14;
      const t16 = requestAnimationFrame(() => {
        m10 = requestAnimationFrame(() => {
          l14 = requestAnimationFrame(() => {
            a10();
          });
        });
      }), p18 = (o26) => {
        o26.target === i20 && (n18.set(o26.propertyName, n18.get(o26.propertyName) - 1), n18.get(o26.propertyName) || n18.delete(o26.propertyName), n18.size === 0 && a10());
      }, d13 = (o26) => {
        o26.target === i20 && (n18.has(o26.propertyName) || n18.set(o26.propertyName, 0), n18.set(o26.propertyName, n18.get(o26.propertyName) + 1), cancelAnimationFrame(t16), cancelAnimationFrame(m10), cancelAnimationFrame(l14));
      };
      i20.addEventListener("transitionrun", d13, { signal: r16.signal }), i20.addEventListener("transitionend", p18, { signal: r16.signal }), i20.addEventListener("transitioncancel", p18, { signal: r16.signal }), v3();
    };
    AbstractOverlay = class _AbstractOverlay extends SpectrumElement {
      constructor() {
        super(...arguments);
        this.dispose = noop;
        this.offset = 0;
        this.willPreventClose = false;
      }
      async applyFocus(e22, r16) {
      }
      get delayed() {
        return false;
      }
      set delayed(e22) {
      }
      get disabled() {
        return false;
      }
      set disabled(e22) {
      }
      get elementResolver() {
        return this._elementResolver;
      }
      set elementResolver(e22) {
        this._elementResolver = e22;
      }
      async ensureOnDOM(e22) {
      }
      async makeTransition(e22) {
        return null;
      }
      async manageDelay(e22) {
      }
      async manageDialogOpen() {
      }
      async managePopoverOpen() {
      }
      managePosition() {
      }
      get open() {
        return false;
      }
      set open(e22) {
      }
      get placementController() {
        return this._placementController;
      }
      set placementController(e22) {
        this._placementController = e22;
      }
      requestSlottable() {
      }
      returnFocus() {
      }
      get state() {
        return "closed";
      }
      set state(e22) {
      }
      manuallyKeepOpen() {
      }
      static update() {
        const e22 = new CustomEvent("sp-update-overlays", { bubbles: true, composed: true, cancelable: true });
        document.dispatchEvent(e22);
      }
      static async open(e22, r16, n18, a10) {
        await Promise.resolve().then(() => (init_sp_overlay(), sp_overlay_exports));
        const m10 = arguments.length === 2, l14 = n18 || e22, t16 = new this();
        let p18 = false;
        t16.dispose = () => {
          t16.addEventListener("sp-closed", () => {
            p18 || (d13(), p18 = true), requestAnimationFrame(() => {
              t16.remove();
            });
          }), t16.open = false, t16.dispose = noop;
        };
        const d13 = reparentChildren([l14], t16, { position: "beforeend", prepareCallback: (s14) => {
          const c19 = s14.slot;
          return s14.removeAttribute("slot"), () => {
            s14.slot = c19;
          };
        } });
        if (!m10 && l14 && a10) {
          const s14 = e22, c19 = r16, u14 = a10;
          return _AbstractOverlay.applyOptions(t16, { ...u14, delayed: u14.delayed || l14.hasAttribute("delayed"), trigger: u14.virtualTrigger || s14, type: c19 === "modal" ? "modal" : c19 === "hover" ? "hint" : "auto" }), s14.insertAdjacentElement("afterend", t16), await t16.updateComplete, t16.open = true, t16.dispose;
        }
        const y3 = r16;
        return t16.append(l14), _AbstractOverlay.applyOptions(t16, { ...y3, delayed: y3.delayed || l14.hasAttribute("delayed") }), t16.updateComplete.then(() => {
          t16.open = true;
        }), t16;
      }
      static applyOptions(e22, r16) {
        var n18, a10;
        e22.delayed = !!r16.delayed, e22.receivesFocus = (n18 = r16.receivesFocus) != null ? n18 : "auto", e22.triggerElement = r16.trigger || null, e22.type = r16.type || "modal", e22.offset = (a10 = r16.offset) != null ? a10 : 0, e22.placement = r16.placement, e22.willPreventClose = !!r16.notImmediatelyClosable;
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/VirtualTrigger.js
var VirtualTrigger;
var init_VirtualTrigger = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/VirtualTrigger.js"() {
    "use strict";
    init_AbstractOverlay();
    VirtualTrigger = class {
      constructor(t16, i20) {
        this.x = 0;
        this.y = 0;
        this.x = t16, this.y = i20;
      }
      updateBoundingClientRect(t16, i20) {
        this.x = t16, this.y = i20, AbstractOverlay.update();
      }
      getBoundingClientRect() {
        return { width: 0, height: 0, top: this.y, right: this.x, y: this.y, x: this.x, bottom: this.y, left: this.x, toJSON() {
        } };
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/events.js
var BeforetoggleClosedEvent, BeforetoggleOpenEvent, OverlayStateEvent;
var init_events = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/events.js"() {
    "use strict";
    BeforetoggleClosedEvent = class extends Event {
      constructor() {
        super("beforetoggle", { bubbles: false, composed: false });
        this.currentState = "open";
        this.newState = "closed";
      }
    };
    BeforetoggleOpenEvent = class extends Event {
      constructor() {
        super("beforetoggle", { bubbles: false, composed: false });
        this.currentState = "closed";
        this.newState = "open";
      }
    };
    OverlayStateEvent = class extends Event {
      constructor(r16, l14, { publish: o26, interaction: s14, reason: n18 }) {
        super(r16, { bubbles: o26, composed: o26 });
        this.overlay = l14;
        this.detail = { interaction: s14, reason: n18 };
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/OverlayDialog.js
function OverlayDialog(h11) {
  class p18 extends h11 {
    async manageDialogOpen() {
      const e22 = this.open;
      if (await this.managePosition(), this.open !== e22) return;
      const i20 = await this.dialogMakeTransition(e22);
      this.open === e22 && await this.dialogApplyFocus(e22, i20);
    }
    async dialogMakeTransition(e22) {
      let i20 = null;
      const m10 = (t16, s14) => async () => {
        if (t16.open = e22, !e22) {
          const n18 = () => {
            t16.removeEventListener("close", n18), a10(t16, s14);
          };
          t16.addEventListener("close", n18);
        }
        if (s14 > 0) return;
        const o26 = e22 ? BeforetoggleOpenEvent : BeforetoggleClosedEvent;
        this.dispatchEvent(new o26()), e22 && (t16.matches(userFocusableSelector) && (i20 = t16), i20 = i20 || firstFocusableIn(t16), i20 || t16.querySelectorAll("slot").forEach((r16) => {
          i20 || (i20 = firstFocusableSlottedIn(r16));
        }), !(!this.isConnected || this.dialogEl.open) && this.dialogEl.showModal());
      }, a10 = (t16, s14) => () => {
        if (this.open !== e22) return;
        const o26 = e22 ? "sp-opened" : "sp-closed";
        if (s14 > 0) {
          t16.dispatchEvent(new OverlayStateEvent(o26, this, { interaction: this.type, publish: false }));
          return;
        }
        if (!this.isConnected || e22 !== this.open) return;
        const n18 = async () => {
          const r16 = this.triggerElement instanceof VirtualTrigger;
          this.dispatchEvent(new OverlayStateEvent(o26, this, { interaction: this.type, publish: r16 })), t16.dispatchEvent(new OverlayStateEvent(o26, this, { interaction: this.type, publish: false })), this.triggerElement && !r16 && this.triggerElement.dispatchEvent(new OverlayStateEvent(o26, this, { interaction: this.type, publish: true })), this.state = e22 ? "opened" : "closed", this.returnFocus(), await nextFrame(), await nextFrame(), e22 === this.open && e22 === false && this.requestSlottable();
        };
        !e22 && this.dialogEl.open ? (this.dialogEl.addEventListener("close", () => {
          n18();
        }, { once: true }), this.dialogEl.close()) : n18();
      };
      return this.elements.forEach((t16, s14) => {
        guaranteedAllTransitionend(t16, m10(t16, s14), a10(t16, s14));
      }), i20;
    }
    async dialogApplyFocus(e22, i20) {
      this.applyFocus(e22, i20);
    }
  }
  return p18;
}
var init_OverlayDialog = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/OverlayDialog.js"() {
    "use strict";
    init_first_focusable_in();
    init_VirtualTrigger();
    init_AbstractOverlay();
    init_events();
    init_src2();
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/OverlayPopover.js
function f5(a10) {
  let c19 = false;
  try {
    c19 = a10.matches(":popover-open");
  } catch (e22) {
  }
  let p18 = false;
  try {
    p18 = a10.matches(":open");
  } catch (e22) {
  }
  return c19 || p18;
}
function OverlayPopover(a10) {
  class c19 extends a10 {
    async manageDelay(e22) {
      if (e22 === false || e22 !== this.open) {
        overlayTimer.close(this);
        return;
      }
      this.delayed && await overlayTimer.openTimer(this) && (this.open = !e22);
    }
    async shouldHidePopover(e22) {
      if (e22 && this.open !== e22) return;
      const o26 = async ({ newState: i20 } = {}) => {
        i20 !== "open" && await this.placementController.resetOverlayPosition();
      };
      if (!f5(this.dialogEl)) {
        o26();
        return;
      }
      this.dialogEl.addEventListener("toggle", o26, { once: true });
    }
    async shouldShowPopover(e22) {
      let o26 = false;
      try {
        o26 = this.dialogEl.matches(":popover-open");
      } catch (u14) {
      }
      let i20 = false;
      try {
        i20 = this.dialogEl.matches(":open");
      } catch (u14) {
      }
      e22 && this.open === e22 && !o26 && !i20 && this.isConnected && (this.dialogEl.showPopover(), await this.managePosition());
    }
    async ensureOnDOM(e22) {
      await nextFrame(), C2 || await this.shouldHidePopover(e22), await this.shouldShowPopover(e22), await nextFrame();
    }
    async makeTransition(e22) {
      if (this.open !== e22) return null;
      let o26 = null;
      const i20 = (t16, s14) => () => {
        if (t16.open = e22, s14 === 0) {
          const r16 = e22 ? BeforetoggleOpenEvent : BeforetoggleClosedEvent;
          this.dispatchEvent(new r16());
        }
        if (!e22 || (t16.matches(userFocusableSelector) && (o26 = t16), o26 = o26 || firstFocusableIn(t16), o26)) return;
        t16.querySelectorAll("slot").forEach((r16) => {
          o26 || (o26 = firstFocusableSlottedIn(r16));
        });
      }, u14 = (t16, s14) => async () => {
        if (this.open !== e22) return;
        const n18 = e22 ? "sp-opened" : "sp-closed";
        if (s14 > 0) {
          t16.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: false }));
          return;
        }
        const r16 = async () => {
          if (this.open !== e22) return;
          await nextFrame();
          const d13 = this.triggerElement instanceof VirtualTrigger;
          this.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: d13 })), t16.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: false })), this.triggerElement && !d13 && this.triggerElement.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: true })), this.state = e22 ? "opened" : "closed", this.returnFocus(), await nextFrame(), await nextFrame(), e22 === this.open && e22 === false && this.requestSlottable();
        };
        if (this.open !== e22) return;
        const v3 = f5(this.dialogEl);
        e22 !== true && v3 && this.isConnected ? (this.dialogEl.addEventListener("beforetoggle", () => {
          r16();
        }, { once: true }), this.dialogEl.hidePopover()) : r16();
      };
      return this.elements.forEach((t16, s14) => {
        guaranteedAllTransitionend(t16, i20(t16, s14), u14(t16, s14));
      }), o26;
    }
  }
  return c19;
}
var C2;
var init_OverlayPopover = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/OverlayPopover.js"() {
    "use strict";
    init_first_focusable_in();
    init_VirtualTrigger();
    init_AbstractOverlay();
    init_events();
    init_src2();
    C2 = CSS.supports("(overlay: auto)");
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/OverlayNoPopover.js
function OverlayNoPopover(a10) {
  class m10 extends a10 {
    async managePopoverOpen() {
      await this.managePosition();
    }
    async manageDelay(e22) {
      if (e22 === false || e22 !== this.open) {
        overlayTimer.close(this);
        return;
      }
      this.delayed && await overlayTimer.openTimer(this) && (this.open = !e22);
    }
    async ensureOnDOM(e22) {
      document.body.offsetHeight;
    }
    async makeTransition(e22) {
      if (this.open !== e22) return null;
      let o26 = null;
      const h11 = (t16, r16) => () => {
        if (e22 !== this.open) return;
        if (t16.open = e22, r16 === 0) {
          const i20 = e22 ? BeforetoggleOpenEvent : BeforetoggleClosedEvent;
          this.dispatchEvent(new i20());
        }
        if (e22 !== true || (t16.matches(userFocusableSelector) && (o26 = t16), o26 = o26 || firstFocusableIn(t16), o26)) return;
        t16.querySelectorAll("slot").forEach((i20) => {
          o26 || (o26 = firstFocusableSlottedIn(i20));
        });
      }, u14 = (t16, r16) => async () => {
        if (this.open !== e22) return;
        const n18 = e22 ? "sp-opened" : "sp-closed";
        if (t16.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type })), r16 > 0) return;
        const i20 = this.triggerElement instanceof VirtualTrigger;
        this.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: i20 })), this.triggerElement && !i20 && this.triggerElement.dispatchEvent(new OverlayStateEvent(n18, this, { interaction: this.type, publish: true })), this.state = e22 ? "opened" : "closed", this.returnFocus(), await nextFrame(), await nextFrame(), e22 === this.open && e22 === false && this.requestSlottable();
      };
      return this.elements.forEach((t16, r16) => {
        guaranteedAllTransitionend(t16, h11(t16, r16), u14(t16, r16));
      }), o26;
    }
  }
  return m10;
}
var init_OverlayNoPopover = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/OverlayNoPopover.js"() {
    "use strict";
    init_first_focusable_in();
    init_VirtualTrigger();
    init_AbstractOverlay();
    init_events();
    init_src2();
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/OverlayStack.js
var c13, h9, overlayStack;
var init_OverlayStack = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/OverlayStack.js"() {
    "use strict";
    c13 = "showPopover" in document.createElement("div");
    h9 = class {
      constructor() {
        this.root = document.body;
        this.stack = [];
        this.handlePointerdown = (t16) => {
          this.pointerdownPath = t16.composedPath(), this.lastOverlay = this.stack.at(-1);
        };
        this.handlePointerup = () => {
          const t16 = this.pointerdownPath;
          if (this.pointerdownPath = void 0, !this.stack.length || !(t16 != null && t16.length)) return;
          const e22 = this.stack.length - 1, s14 = this.stack.filter((n18, i20) => !t16.find((a10) => a10 === n18 || a10 === (n18 == null ? void 0 : n18.triggerElement) && (n18 == null ? void 0 : n18.type) === "hint" || i20 === e22 && n18 !== this.lastOverlay && n18.triggerInteraction === "longpress") && !n18.shouldPreventClose() && n18.type !== "manual");
          s14.reverse(), s14.forEach((n18) => {
            this.closeOverlay(n18);
            let i20 = n18.parentOverlayToForceClose;
            for (; i20; ) this.closeOverlay(i20), i20 = i20.parentOverlayToForceClose;
          });
        };
        this.handleBeforetoggle = (t16) => {
          const { target: e22, newState: s14 } = t16;
          s14 !== "open" && this.closeOverlay(e22);
        };
        this.handleKeydown = (t16) => {
          if (t16.code !== "Escape" || !this.stack.length) return;
          const e22 = this.stack.at(-1);
          if ((e22 == null ? void 0 : e22.type) === "page") {
            t16.preventDefault();
            return;
          }
          c13 || (e22 == null ? void 0 : e22.type) !== "manual" && e22 && this.closeOverlay(e22);
        };
        this.bindEvents();
      }
      get document() {
        return this.root.ownerDocument || document;
      }
      bindEvents() {
        this.document.addEventListener("pointerdown", this.handlePointerdown), this.document.addEventListener("pointerup", this.handlePointerup), this.document.addEventListener("keydown", this.handleKeydown);
      }
      closeOverlay(t16) {
        const e22 = this.stack.indexOf(t16);
        e22 > -1 && this.stack.splice(e22, 1), t16.open = false;
      }
      overlaysByTriggerElement(t16) {
        return this.stack.filter((e22) => e22.triggerElement === t16);
      }
      add(t16) {
        if (this.stack.includes(t16)) {
          const e22 = this.stack.indexOf(t16);
          e22 > -1 && (this.stack.splice(e22, 1), this.stack.push(t16));
          return;
        }
        if (t16.type === "auto" || t16.type === "modal" || t16.type === "page") {
          const e22 = "sp-overlay-query-path", s14 = new Event(e22, { composed: true, bubbles: true });
          t16.addEventListener(e22, (n18) => {
            const i20 = n18.composedPath();
            this.stack.forEach((r16) => {
              !i20.find((o26) => o26 === r16) && r16.type !== "manual" && this.closeOverlay(r16);
            });
          }, { once: true }), t16.dispatchEvent(s14);
        } else if (t16.type === "hint") {
          if (this.stack.some((s14) => s14.type !== "manual" && s14.triggerElement && s14.triggerElement === t16.triggerElement)) {
            t16.open = false;
            return;
          }
          this.stack.forEach((s14) => {
            s14.type === "hint" && this.closeOverlay(s14);
          });
        }
        requestAnimationFrame(() => {
          this.stack.push(t16), t16.addEventListener("beforetoggle", this.handleBeforetoggle, { once: true });
        });
      }
      remove(t16) {
        this.closeOverlay(t16);
      }
    };
    overlayStack = new h9();
  }
});

// ../node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  return ["top", "bottom"].includes(getSide(placement)) ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment]);
}
function getSideList(side, isStart, rtl) {
  const lr = ["left", "right"];
  const rl = ["right", "left"];
  const tb = ["top", "bottom"];
  const bt = ["bottom", "top"];
  switch (side) {
    case "top":
    case "bottom":
      if (rtl) return isStart ? rl : lr;
      return isStart ? lr : rl;
    case "left":
    case "right":
      return isStart ? tb : bt;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x: x4,
    y: y3,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y3,
    left: x4,
    right: x4 + width,
    bottom: y3 + height,
    x: x4,
    y: y3
  };
}
var min, max, round, floor, createCoords, oppositeSideMap, oppositeAlignmentMap;
var init_floating_ui_utils = __esm({
  "../node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs"() {
    min = Math.min;
    max = Math.max;
    round = Math.round;
    floor = Math.floor;
    createCoords = (v3) => ({
      x: v3,
      y: v3
    });
    oppositeSideMap = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom"
    };
    oppositeAlignmentMap = {
      start: "end",
      end: "start"
    };
  }
});

// ../node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x: x4,
    y: y3,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x: x4,
    y: y3,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = ["left", "top"].includes(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: 0,
    crossAxis: 0,
    alignmentAxis: null,
    ...rawValue
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var computePosition, arrow, flip, offset, shift, size;
var init_floating_ui_core = __esm({
  "../node_modules/@floating-ui/core/dist/floating-ui.core.mjs"() {
    init_floating_ui_utils();
    init_floating_ui_utils();
    computePosition = async (reference, floating, config) => {
      const {
        placement = "bottom",
        strategy = "absolute",
        middleware = [],
        platform: platform2
      } = config;
      const validMiddleware = middleware.filter(Boolean);
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
      let rects = await platform2.getElementRects({
        reference,
        floating,
        strategy
      });
      let {
        x: x4,
        y: y3
      } = computeCoordsFromPlacement(rects, placement, rtl);
      let statefulPlacement = placement;
      let middlewareData = {};
      let resetCount = 0;
      for (let i20 = 0; i20 < validMiddleware.length; i20++) {
        const {
          name,
          fn
        } = validMiddleware[i20];
        const {
          x: nextX,
          y: nextY,
          data,
          reset
        } = await fn({
          x: x4,
          y: y3,
          initialPlacement: placement,
          placement: statefulPlacement,
          strategy,
          middlewareData,
          rects,
          platform: platform2,
          elements: {
            reference,
            floating
          }
        });
        x4 = nextX != null ? nextX : x4;
        y3 = nextY != null ? nextY : y3;
        middlewareData = {
          ...middlewareData,
          [name]: {
            ...middlewareData[name],
            ...data
          }
        };
        if (reset && resetCount <= 50) {
          resetCount++;
          if (typeof reset === "object") {
            if (reset.placement) {
              statefulPlacement = reset.placement;
            }
            if (reset.rects) {
              rects = reset.rects === true ? await platform2.getElementRects({
                reference,
                floating,
                strategy
              }) : reset.rects;
            }
            ({
              x: x4,
              y: y3
            } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
          }
          i20 = -1;
        }
      }
      return {
        x: x4,
        y: y3,
        placement: statefulPlacement,
        strategy,
        middlewareData
      };
    };
    arrow = (options) => ({
      name: "arrow",
      options,
      async fn(state) {
        const {
          x: x4,
          y: y3,
          placement,
          rects,
          platform: platform2,
          elements,
          middlewareData
        } = state;
        const {
          element,
          padding = 0
        } = evaluate(options, state) || {};
        if (element == null) {
          return {};
        }
        const paddingObject = getPaddingObject(padding);
        const coords = {
          x: x4,
          y: y3
        };
        const axis = getAlignmentAxis(placement);
        const length = getAxisLength(axis);
        const arrowDimensions = await platform2.getDimensions(element);
        const isYAxis = axis === "y";
        const minProp = isYAxis ? "top" : "left";
        const maxProp = isYAxis ? "bottom" : "right";
        const clientProp = isYAxis ? "clientHeight" : "clientWidth";
        const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
        const startDiff = coords[axis] - rects.reference[axis];
        const arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element));
        let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
        if (!clientSize || !await (platform2.isElement == null ? void 0 : platform2.isElement(arrowOffsetParent))) {
          clientSize = elements.floating[clientProp] || rects.floating[length];
        }
        const centerToReference = endDiff / 2 - startDiff / 2;
        const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
        const minPadding = min(paddingObject[minProp], largestPossiblePadding);
        const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);
        const min$1 = minPadding;
        const max2 = clientSize - arrowDimensions[length] - maxPadding;
        const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
        const offset3 = clamp(min$1, center, max2);
        const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset3 && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
        const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max2 : 0;
        return {
          [axis]: coords[axis] + alignmentOffset,
          data: {
            [axis]: offset3,
            centerOffset: center - offset3 - alignmentOffset,
            ...shouldAddOffset && {
              alignmentOffset
            }
          },
          reset: shouldAddOffset
        };
      }
    });
    flip = function(options) {
      if (options === void 0) {
        options = {};
      }
      return {
        name: "flip",
        options,
        async fn(state) {
          var _middlewareData$arrow, _middlewareData$flip;
          const {
            placement,
            middlewareData,
            rects,
            initialPlacement,
            platform: platform2,
            elements
          } = state;
          const {
            mainAxis: checkMainAxis = true,
            crossAxis: checkCrossAxis = true,
            fallbackPlacements: specifiedFallbackPlacements,
            fallbackStrategy = "bestFit",
            fallbackAxisSideDirection = "none",
            flipAlignment = true,
            ...detectOverflowOptions
          } = evaluate(options, state);
          if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
            return {};
          }
          const side = getSide(placement);
          const initialSideAxis = getSideAxis(initialPlacement);
          const isBasePlacement = getSide(initialPlacement) === initialPlacement;
          const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
          const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
          const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
          if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
            fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
          }
          const placements2 = [initialPlacement, ...fallbackPlacements];
          const overflow = await detectOverflow(state, detectOverflowOptions);
          const overflows = [];
          let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
          if (checkMainAxis) {
            overflows.push(overflow[side]);
          }
          if (checkCrossAxis) {
            const sides2 = getAlignmentSides(placement, rects, rtl);
            overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
          }
          overflowsData = [...overflowsData, {
            placement,
            overflows
          }];
          if (!overflows.every((side2) => side2 <= 0)) {
            var _middlewareData$flip2, _overflowsData$filter;
            const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
            const nextPlacement = placements2[nextIndex];
            if (nextPlacement) {
              return {
                data: {
                  index: nextIndex,
                  overflows: overflowsData
                },
                reset: {
                  placement: nextPlacement
                }
              };
            }
            let resetPlacement = (_overflowsData$filter = overflowsData.filter((d13) => d13.overflows[0] <= 0).sort((a10, b6) => a10.overflows[1] - b6.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
            if (!resetPlacement) {
              switch (fallbackStrategy) {
                case "bestFit": {
                  var _overflowsData$filter2;
                  const placement2 = (_overflowsData$filter2 = overflowsData.filter((d13) => {
                    if (hasFallbackAxisSideDirection) {
                      const currentSideAxis = getSideAxis(d13.placement);
                      return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                      // reading directions favoring greater width.
                      currentSideAxis === "y";
                    }
                    return true;
                  }).map((d13) => [d13.placement, d13.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a10, b6) => a10[1] - b6[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                  if (placement2) {
                    resetPlacement = placement2;
                  }
                  break;
                }
                case "initialPlacement":
                  resetPlacement = initialPlacement;
                  break;
              }
            }
            if (placement !== resetPlacement) {
              return {
                reset: {
                  placement: resetPlacement
                }
              };
            }
          }
          return {};
        }
      };
    };
    offset = function(options) {
      if (options === void 0) {
        options = 0;
      }
      return {
        name: "offset",
        options,
        async fn(state) {
          var _middlewareData$offse, _middlewareData$arrow;
          const {
            x: x4,
            y: y3,
            placement,
            middlewareData
          } = state;
          const diffCoords = await convertValueToCoords(state, options);
          if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
            return {};
          }
          return {
            x: x4 + diffCoords.x,
            y: y3 + diffCoords.y,
            data: {
              ...diffCoords,
              placement
            }
          };
        }
      };
    };
    shift = function(options) {
      if (options === void 0) {
        options = {};
      }
      return {
        name: "shift",
        options,
        async fn(state) {
          const {
            x: x4,
            y: y3,
            placement
          } = state;
          const {
            mainAxis: checkMainAxis = true,
            crossAxis: checkCrossAxis = false,
            limiter = {
              fn: (_ref) => {
                let {
                  x: x5,
                  y: y4
                } = _ref;
                return {
                  x: x5,
                  y: y4
                };
              }
            },
            ...detectOverflowOptions
          } = evaluate(options, state);
          const coords = {
            x: x4,
            y: y3
          };
          const overflow = await detectOverflow(state, detectOverflowOptions);
          const crossAxis = getSideAxis(getSide(placement));
          const mainAxis = getOppositeAxis(crossAxis);
          let mainAxisCoord = coords[mainAxis];
          let crossAxisCoord = coords[crossAxis];
          if (checkMainAxis) {
            const minSide = mainAxis === "y" ? "top" : "left";
            const maxSide = mainAxis === "y" ? "bottom" : "right";
            const min2 = mainAxisCoord + overflow[minSide];
            const max2 = mainAxisCoord - overflow[maxSide];
            mainAxisCoord = clamp(min2, mainAxisCoord, max2);
          }
          if (checkCrossAxis) {
            const minSide = crossAxis === "y" ? "top" : "left";
            const maxSide = crossAxis === "y" ? "bottom" : "right";
            const min2 = crossAxisCoord + overflow[minSide];
            const max2 = crossAxisCoord - overflow[maxSide];
            crossAxisCoord = clamp(min2, crossAxisCoord, max2);
          }
          const limitedCoords = limiter.fn({
            ...state,
            [mainAxis]: mainAxisCoord,
            [crossAxis]: crossAxisCoord
          });
          return {
            ...limitedCoords,
            data: {
              x: limitedCoords.x - x4,
              y: limitedCoords.y - y3
            }
          };
        }
      };
    };
    size = function(options) {
      if (options === void 0) {
        options = {};
      }
      return {
        name: "size",
        options,
        async fn(state) {
          const {
            placement,
            rects,
            platform: platform2,
            elements
          } = state;
          const {
            apply = () => {
            },
            ...detectOverflowOptions
          } = evaluate(options, state);
          const overflow = await detectOverflow(state, detectOverflowOptions);
          const side = getSide(placement);
          const alignment = getAlignment(placement);
          const isYAxis = getSideAxis(placement) === "y";
          const {
            width,
            height
          } = rects.floating;
          let heightSide;
          let widthSide;
          if (side === "top" || side === "bottom") {
            heightSide = side;
            widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
          } else {
            widthSide = side;
            heightSide = alignment === "end" ? "top" : "bottom";
          }
          const maximumClippingHeight = height - overflow.top - overflow.bottom;
          const maximumClippingWidth = width - overflow.left - overflow.right;
          const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
          const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
          const noShift = !state.middlewareData.shift;
          let availableHeight = overflowAvailableHeight;
          let availableWidth = overflowAvailableWidth;
          if (isYAxis) {
            availableWidth = alignment || noShift ? min(overflowAvailableWidth, maximumClippingWidth) : maximumClippingWidth;
          } else {
            availableHeight = alignment || noShift ? min(overflowAvailableHeight, maximumClippingHeight) : maximumClippingHeight;
          }
          if (noShift && !alignment) {
            const xMin = max(overflow.left, 0);
            const xMax = max(overflow.right, 0);
            const yMin = max(overflow.top, 0);
            const yMax = max(overflow.bottom, 0);
            if (isYAxis) {
              availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
            } else {
              availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
            }
          }
          await apply({
            ...state,
            availableWidth,
            availableHeight
          });
          const nextDimensions = await platform2.getDimensions(elements.floating);
          if (width !== nextDimensions.width || height !== nextDimensions.height) {
            return {
              reset: {
                rects: true
              }
            };
          }
          return {};
        }
      };
    };
  }
});

// ../node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !["inline", "contents"].includes(display);
}
function isTableElement(element) {
  return ["table", "td", "th"].includes(getNodeName(element));
}
function isTopLayer(element) {
  return [":popover-open", ":modal"].some((selector) => {
    try {
      return element.matches(selector);
    } catch (e22) {
      return false;
    }
  });
}
function isContainingBlock(element) {
  const webkit = isWebKit();
  const css = getComputedStyle(element);
  return css.transform !== "none" || css.perspective !== "none" || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || ["transform", "perspective", "filter"].some((value) => (css.willChange || "").includes(value)) || ["paint", "layout", "strict", "content"].some((value) => (css.contain || "").includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isTopLayer(currentNode)) {
      return null;
    }
    if (isContainingBlock(currentNode)) {
      return currentNode;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === "undefined" || !CSS.supports) return false;
  return CSS.supports("-webkit-backdrop-filter", "none");
}
function isLastTraversableNode(node) {
  return ["html", "body", "#document"].includes(getNodeName(node));
}
function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], win.frameElement && traverseIframes ? getOverflowAncestors(win.frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
var init_floating_ui_utils_dom = __esm({
  "../node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs"() {
  }
});

// ../node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $: $2
  } = getCssDimensions(domElement);
  let x4 = ($2 ? round(rect.width) : rect.width) / width;
  let y3 = ($2 ? round(rect.height) : rect.height) / height;
  if (!x4 || !Number.isFinite(x4)) {
    x4 = 1;
  }
  if (!y3 || !Number.isFinite(y3)) {
    y3 = 1;
  }
  return {
    x: x4,
    y: y3
  };
}
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x4 = (clientRect.left + visualOffsets.x) / scale.x;
  let y3 = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = currentWin.frameElement;
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x4 *= iframeScale.x;
      y3 *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x4 += left;
      y3 += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = currentWin.frameElement;
    }
  }
  return rectToClientRect({
    width,
    height,
    x: x4,
    y: y3
  });
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getWindowScrollBarX(element) {
  return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x4 = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y3 = -scroll.scrollTop;
  if (getComputedStyle(body).direction === "rtl") {
    x4 += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x: x4,
    y: y3
  };
}
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x4 = 0;
  let y3 = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x4 = visualViewport.offsetLeft;
      y3 = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x: x4,
    y: y3
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x4 = left * scale.x;
  const y3 = top * scale.y;
  return {
    width,
    height,
    x: x4,
    y: y3
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      ...clippingAncestor,
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && ["absolute", "fixed"].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  const x4 = rect.left + scroll.scrollLeft - offsets.x;
  const y3 = rect.top + scroll.scrollTop - offsets.y;
  return {
    x: x4,
    y: y3,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  return element.offsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
function isRTL(element) {
  return getComputedStyle(element).direction === "rtl";
}
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const {
      left,
      top,
      width,
      height
    } = element.getBoundingClientRect();
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (e22) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...getOverflowAncestors(floating)] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
var noOffsets, getElementRects, platform, offset2, shift2, flip2, size2, arrow2, computePosition2;
var init_floating_ui_dom = __esm({
  "../node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs"() {
    init_floating_ui_core();
    init_floating_ui_utils();
    init_floating_ui_utils_dom();
    noOffsets = /* @__PURE__ */ createCoords(0);
    getElementRects = async function(data) {
      const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
      const getDimensionsFn = this.getDimensions;
      const floatingDimensions = await getDimensionsFn(data.floating);
      return {
        reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
        floating: {
          x: 0,
          y: 0,
          width: floatingDimensions.width,
          height: floatingDimensions.height
        }
      };
    };
    platform = {
      convertOffsetParentRelativeRectToViewportRelativeRect,
      getDocumentElement,
      getClippingRect,
      getOffsetParent,
      getElementRects,
      getClientRects,
      getDimensions,
      getScale,
      isElement,
      isRTL
    };
    offset2 = offset;
    shift2 = shift;
    flip2 = flip;
    size2 = size;
    arrow2 = arrow;
    computePosition2 = (reference, floating, options) => {
      const cache = /* @__PURE__ */ new Map();
      const mergedOptions = {
        platform,
        ...options
      };
      const platformWithCache = {
        ...mergedOptions.platform,
        _c: cache
      };
      return computePosition(reference, floating, {
        ...mergedOptions,
        platform: platformWithCache
      });
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/PlacementController.js
function c14(o26) {
  if (typeof o26 == "undefined") return 0;
  const t16 = window.devicePixelRatio || 1;
  return Math.round(o26 * t16) / t16;
}
var p11, C3, T3, placementUpdatedSymbol, PlacementController;
var init_PlacementController = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/PlacementController.js"() {
    "use strict";
    init_floating_ui_dom();
    p11 = 8;
    C3 = 100;
    T3 = (o26) => {
      var e22;
      return (e22 = { left: ["right", "bottom", "top"], "left-start": ["right-start", "bottom", "top"], "left-end": ["right-end", "bottom", "top"], right: ["left", "bottom", "top"], "right-start": ["left-start", "bottom", "top"], "right-end": ["left-end", "bottom", "top"], top: ["bottom", "left", "right"], "top-start": ["bottom-start", "left", "right"], "top-end": ["bottom-end", "left", "right"], bottom: ["top", "left", "right"], "bottom-start": ["top-start", "left", "right"], "bottom-end": ["top-end", "left", "right"] }[o26]) != null ? e22 : [o26];
    };
    placementUpdatedSymbol = Symbol("placement updated");
    PlacementController = class {
      constructor(t16) {
        this.originalPlacements = /* @__PURE__ */ new WeakMap();
        this.allowPlacementUpdate = false;
        this.closeForAncestorUpdate = () => {
          !this.allowPlacementUpdate && this.options.type !== "modal" && this.cleanup && this.target.dispatchEvent(new Event("close", { bubbles: true })), this.allowPlacementUpdate = false;
        };
        this.updatePlacement = () => {
          this.computePlacement();
        };
        this.resetOverlayPosition = () => {
          !this.target || !this.options || (this.clearOverlayPosition(), this.host.offsetHeight, this.computePlacement());
        };
        this.host = t16, this.host.addController(this);
      }
      async placeOverlay(t16 = this.target, e22 = this.options) {
        if (this.target = t16, this.options = e22, !t16 || !e22) return;
        const m10 = autoUpdate(e22.trigger, t16, this.closeForAncestorUpdate, { ancestorResize: false, elementResize: false, layoutShift: false }), h11 = autoUpdate(e22.trigger, t16, this.updatePlacement, { ancestorScroll: false });
        this.cleanup = () => {
          var n18;
          (n18 = this.host.elements) == null || n18.forEach((a10) => {
            a10.addEventListener("sp-closed", () => {
              const r16 = this.originalPlacements.get(a10);
              r16 && a10.setAttribute("placement", r16), this.originalPlacements.delete(a10);
            }, { once: true });
          }), m10(), h11();
        };
      }
      async computePlacement() {
        var g4, u14;
        const { options: t16, target: e22 } = this;
        await (document.fonts ? document.fonts.ready : Promise.resolve());
        const m10 = t16.trigger instanceof HTMLElement ? flip2() : flip2({ padding: p11, fallbackPlacements: T3(t16.placement) }), [h11 = 0, n18 = 0] = Array.isArray(t16 == null ? void 0 : t16.offset) ? t16.offset : [t16.offset, 0], a10 = (g4 = this.host.elements.find((i20) => i20.tipElement)) == null ? void 0 : g4.tipElement, r16 = [offset2({ mainAxis: h11, crossAxis: n18 }), shift2({ padding: p11 }), m10, size2({ padding: p11, apply: ({ availableWidth: i20, availableHeight: d13, rects: { floating: x4 } }) => {
          const b6 = Math.max(C3, Math.floor(d13)), l14 = x4.height;
          this.initialHeight = this.isConstrained && this.initialHeight || l14, this.isConstrained = l14 < this.initialHeight || b6 <= l14;
          const O = this.isConstrained ? `${b6}px` : "";
          Object.assign(e22.style, { maxWidth: `${Math.floor(i20)}px`, maxHeight: O });
        } }), ...a10 ? [arrow2({ element: a10, padding: t16.tipPadding || p11 })] : []], { x: P2, y: E3, placement: s14, middlewareData: f8 } = await computePosition2(t16.trigger, e22, { placement: t16.placement, middleware: r16, strategy: "fixed" });
        if (Object.assign(e22.style, { top: "0px", left: "0px", translate: `${c14(P2)}px ${c14(E3)}px` }), e22.setAttribute("actual-placement", s14), (u14 = this.host.elements) == null || u14.forEach((i20) => {
          this.originalPlacements.has(i20) || this.originalPlacements.set(i20, i20.getAttribute("placement")), i20.setAttribute("placement", s14);
        }), a10 && f8.arrow) {
          const { x: i20, y: d13 } = f8.arrow;
          Object.assign(a10.style, { top: s14.startsWith("right") || s14.startsWith("left") ? "0px" : "", left: s14.startsWith("bottom") || s14.startsWith("top") ? "0px" : "", translate: `${c14(i20)}px ${c14(d13)}px` });
        }
      }
      clearOverlayPosition() {
        this.target && (this.target.style.removeProperty("max-height"), this.target.style.removeProperty("max-width"), this.initialHeight = void 0, this.isConstrained = false);
      }
      hostConnected() {
        document.addEventListener("sp-update-overlays", this.resetOverlayPosition);
      }
      hostUpdated() {
        var t16;
        this.host.open || ((t16 = this.cleanup) == null || t16.call(this), this.cleanup = void 0);
      }
      hostDisconnected() {
        var t16;
        (t16 = this.cleanup) == null || t16.call(this), this.cleanup = void 0, document.removeEventListener("sp-update-overlays", this.resetOverlayPosition);
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/InteractionController.js
var InteractionTypes, InteractionController;
var init_InteractionController = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/InteractionController.js"() {
    "use strict";
    InteractionTypes = ((r16) => (r16[r16.click = 0] = "click", r16[r16.hover = 1] = "hover", r16[r16.longpress = 2] = "longpress", r16))(InteractionTypes || {});
    InteractionController = class {
      constructor(e22, { overlay: t16, isPersistent: r16, handleOverlayReady: i20 }) {
        this.target = e22;
        this.isLazilyOpen = false;
        this.isPersistent = false;
        this.isPersistent = !!r16, this.handleOverlayReady = i20, this.isPersistent && this.init(), this.overlay = t16;
      }
      get activelyOpening() {
        return false;
      }
      get open() {
        var e22, t16;
        return (t16 = (e22 = this.overlay) == null ? void 0 : e22.open) != null ? t16 : this.isLazilyOpen;
      }
      set open(e22) {
        if (e22 !== this.open) {
          if (this.isLazilyOpen = e22, this.overlay) {
            this.overlay.open = e22;
            return;
          }
          e22 && (customElements.whenDefined("sp-overlay").then(async () => {
            const { Overlay: t16 } = await Promise.resolve().then(() => (init_Overlay(), Overlay_exports));
            this.overlay = new t16(), this.overlay.open = true;
          }), Promise.resolve().then(() => (init_sp_overlay(), sp_overlay_exports)));
        }
      }
      get overlay() {
        return this._overlay;
      }
      set overlay(e22) {
        var t16;
        e22 && this.overlay !== e22 && (this.overlay && this.overlay.removeController(this), this._overlay = e22, this.overlay.addController(this), this.initOverlay(), this.prepareDescription(this.target), (t16 = this.handleOverlayReady) == null || t16.call(this, this.overlay));
      }
      prepareDescription(e22) {
      }
      releaseDescription() {
      }
      shouldCompleteOpen() {
      }
      init() {
      }
      initOverlay() {
      }
      abort() {
        var e22;
        this.releaseDescription(), (e22 = this.abortController) == null || e22.abort();
      }
      hostConnected() {
        this.init();
      }
      hostDisconnected() {
        this.isPersistent || this.abort();
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/LongpressController.js
var g3, LONGPRESS_INSTRUCTIONS, LongpressController;
var init_LongpressController = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/LongpressController.js"() {
    "use strict";
    init_platform();
    init_condition_attribute_with_id();
    init_random_id();
    init_AbstractOverlay();
    init_InteractionController();
    g3 = 300;
    LONGPRESS_INSTRUCTIONS = { touch: "Double tap and long press for additional options", keyboard: "Press Space or Alt+Down Arrow for additional options", mouse: "Click and hold for additional options" };
    LongpressController = class extends InteractionController {
      constructor() {
        super(...arguments);
        this.type = InteractionTypes.longpress;
        this.longpressState = null;
        this.releaseDescription = noop;
        this.handlePointerup = () => {
          var e22;
          clearTimeout(this.timeout), this.target && (this.longpressState = ((e22 = this.overlay) == null ? void 0 : e22.state) === "opening" ? "pressed" : null, document.removeEventListener("pointerup", this.handlePointerup), document.removeEventListener("pointercancel", this.handlePointerup));
        };
      }
      get activelyOpening() {
        return this.longpressState === "opening" || this.longpressState === "pressed";
      }
      handleLongpress() {
        this.open = true, this.longpressState = this.longpressState === "potential" ? "opening" : "pressed";
      }
      handlePointerdown(e22) {
        !this.target || e22.button !== 0 || (this.longpressState = "potential", document.addEventListener("pointerup", this.handlePointerup), document.addEventListener("pointercancel", this.handlePointerup), "holdAffordance" in this.target) || (this.timeout = setTimeout(() => {
          this.target && this.target.dispatchEvent(new CustomEvent("longpress", { bubbles: true, composed: true, detail: { source: "pointer" } }));
        }, g3));
      }
      handleKeydown(e22) {
        const { code: t16, altKey: o26 } = e22;
        o26 && t16 === "ArrowDown" && (e22.stopPropagation(), e22.stopImmediatePropagation());
      }
      handleKeyup(e22) {
        const { code: t16, altKey: o26 } = e22;
        if (t16 === "Space" || o26 && t16 === "ArrowDown") {
          if (!this.target) return;
          e22.stopPropagation(), this.target.dispatchEvent(new CustomEvent("longpress", { bubbles: true, composed: true, detail: { source: "keyboard" } })), setTimeout(() => {
            this.longpressState = null;
          });
        }
      }
      prepareDescription(e22) {
        if (this.releaseDescription !== noop || !this.overlay.elements.length) return;
        const t16 = document.createElement("div");
        t16.id = `longpress-describedby-descriptor-${randomID()}`;
        const o26 = isIOS() || isAndroid() ? "touch" : "keyboard";
        t16.textContent = LONGPRESS_INSTRUCTIONS[o26], t16.slot = "longpress-describedby-descriptor";
        const n18 = e22.getRootNode(), s14 = this.overlay.getRootNode();
        n18 === s14 ? this.overlay.append(t16) : (t16.hidden = !("host" in n18), e22.insertAdjacentElement("afterend", t16));
        const i20 = conditionAttributeWithId(e22, "aria-describedby", [t16.id]);
        this.releaseDescription = () => {
          i20(), t16.remove(), this.releaseDescription = noop;
        };
      }
      shouldCompleteOpen() {
        this.longpressState = this.longpressState === "pressed" ? null : this.longpressState;
      }
      init() {
        var t16;
        (t16 = this.abortController) == null || t16.abort(), this.abortController = new AbortController();
        const { signal: e22 } = this.abortController;
        this.target.addEventListener("longpress", () => this.handleLongpress(), { signal: e22 }), this.target.addEventListener("pointerdown", (o26) => this.handlePointerdown(o26), { signal: e22 }), this.prepareDescription(this.target), !this.target.holdAffordance && (this.target.addEventListener("keydown", (o26) => this.handleKeydown(o26), { signal: e22 }), this.target.addEventListener("keyup", (o26) => this.handleKeyup(o26), { signal: e22 }));
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/ClickController.js
var ClickController;
var init_ClickController = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/ClickController.js"() {
    "use strict";
    init_InteractionController();
    ClickController = class extends InteractionController {
      constructor() {
        super(...arguments);
        this.type = InteractionTypes.click;
        this.preventNextToggle = false;
      }
      handleClick() {
        this.preventNextToggle || (this.open = !this.open), this.preventNextToggle = false;
      }
      handlePointerdown() {
        this.preventNextToggle = this.open;
      }
      init() {
        var t16;
        (t16 = this.abortController) == null || t16.abort(), this.abortController = new AbortController();
        const { signal: e22 } = this.abortController;
        this.target.addEventListener("click", () => this.handleClick(), { signal: e22 }), this.target.addEventListener("pointerdown", () => this.handlePointerdown(), { signal: e22 });
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/HoverController.js
var d8, HoverController;
var init_HoverController = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/HoverController.js"() {
    "use strict";
    init_condition_attribute_with_id();
    init_random_id();
    init_InteractionController();
    init_AbstractOverlay();
    d8 = 300;
    HoverController = class extends InteractionController {
      constructor() {
        super(...arguments);
        this.type = InteractionTypes.hover;
        this.elementIds = [];
        this.focusedin = false;
        this.pointerentered = false;
      }
      handleTargetFocusin() {
        this.target.matches(":focus-visible") && (this.open = true, this.focusedin = true);
      }
      handleTargetFocusout() {
        this.focusedin = false, !this.pointerentered && (this.open = false);
      }
      handleTargetPointerenter() {
        var e22;
        this.hoverTimeout && (clearTimeout(this.hoverTimeout), this.hoverTimeout = void 0), !((e22 = this.overlay) != null && e22.disabled) && (this.open = true, this.pointerentered = true);
      }
      handleTargetPointerleave() {
        this.doPointerleave();
      }
      handleHostPointerenter() {
        this.hoverTimeout && (clearTimeout(this.hoverTimeout), this.hoverTimeout = void 0);
      }
      handleHostPointerleave() {
        this.doPointerleave();
      }
      prepareDescription() {
        if (!this.overlay.elements.length) return;
        const e22 = this.target.getRootNode(), t16 = this.overlay.elements[0].getRootNode(), r16 = this.overlay.getRootNode();
        e22 === r16 ? this.prepareOverlayRelativeDescription() : e22 === t16 && this.prepareContentRelativeDescription();
      }
      prepareOverlayRelativeDescription() {
        const e22 = conditionAttributeWithId(this.target, "aria-describedby", [this.overlay.id]);
        this.releaseDescription = () => {
          e22(), this.releaseDescription = noop;
        };
      }
      prepareContentRelativeDescription() {
        const e22 = [], t16 = this.overlay.elements.map((i20) => (e22.push(i20.id), i20.id || (i20.id = `${this.overlay.tagName.toLowerCase()}-helper-${randomID()}`), i20.id));
        this.elementIds = e22;
        const r16 = conditionAttributeWithId(this.target, "aria-describedby", t16);
        this.releaseDescription = () => {
          r16(), this.overlay.elements.map((i20, n18) => {
            i20.id = this.elementIds[n18];
          }), this.releaseDescription = noop;
        };
      }
      doPointerleave() {
        this.pointerentered = false;
        const e22 = this.target;
        this.focusedin && e22.matches(":focus-visible") || (this.hoverTimeout = setTimeout(() => {
          this.open = false;
        }, d8));
      }
      init() {
        var t16;
        (t16 = this.abortController) == null || t16.abort(), this.abortController = new AbortController();
        const { signal: e22 } = this.abortController;
        this.target.addEventListener("focusin", () => this.handleTargetFocusin(), { signal: e22 }), this.target.addEventListener("focusout", () => this.handleTargetFocusout(), { signal: e22 }), this.target.addEventListener("pointerenter", () => this.handleTargetPointerenter(), { signal: e22 }), this.target.addEventListener("pointerleave", () => this.handleTargetPointerleave(), { signal: e22 }), this.overlay && this.initOverlay();
      }
      initOverlay() {
        if (!this.abortController) return;
        const { signal: e22 } = this.abortController;
        this.overlay.addEventListener("pointerenter", () => this.handleHostPointerenter(), { signal: e22 }), this.overlay.addEventListener("pointerleave", () => this.handleHostPointerleave(), { signal: e22 });
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/strategies.js
var strategies;
var init_strategies = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/strategies.js"() {
    "use strict";
    init_ClickController();
    init_HoverController();
    init_LongpressController();
    strategies = { click: ClickController, longpress: LongpressController, hover: HoverController };
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/overlay.css.js
var o22, overlay_css_default;
var init_overlay_css = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/overlay.css.js"() {
    "use strict";
    init_src();
    o22 = i3`
    :host{pointer-events:none;--swc-overlay-animation-distance:var(--spectrum-spacing-100);display:contents}:host(:has(>sp-tooltip)){--swc-overlay-animation-distance:var(--spectrum-tooltip-animation-distance)}.dialog{box-sizing:border-box;--sp-overlay-open:true;background:0 0;border:0;max-width:calc(100vw - 16px);height:auto;max-height:calc(100dvh - 16px);margin:0;padding:0;display:flex;position:fixed;inset:0 auto auto 0;overflow:visible;opacity:1!important}.dialog:not([is-visible]){display:none}.dialog:focus{outline:none}dialog:modal{--mod-popover-filter:var(--spectrum-popover-filter)}:host(:not([open])) .dialog{--sp-overlay-open:false}.dialog::backdrop{display:none}.dialog:before{content:"";position:absolute;inset:-999em;pointer-events:auto!important}.dialog:not(.not-immediately-closable):before{display:none}.dialog>div{width:100%}::slotted(*){pointer-events:auto;visibility:visible!important}::slotted(sp-popover){position:static}.dialog:not([actual-placement])[placement*=top]{padding-block:var(--swc-overlay-animation-distance);margin-top:var(--swc-overlay-animation-distance)}.dialog:not([actual-placement])[placement*=right]{padding-inline:var(--swc-overlay-animation-distance);margin-left:calc(-1*var(--swc-overlay-animation-distance))}.dialog:not([actual-placement])[placement*=bottom]{padding-block:var(--swc-overlay-animation-distance);margin-top:calc(-1*var(--swc-overlay-animation-distance))}.dialog:not([actual-placement])[placement*=left]{padding-inline:var(--swc-overlay-animation-distance);margin-left:var(--swc-overlay-animation-distance)}.dialog[actual-placement*=top]{padding-block:var(--swc-overlay-animation-distance);margin-top:var(--swc-overlay-animation-distance)}.dialog[actual-placement*=right]{padding-inline:var(--swc-overlay-animation-distance);margin-left:calc(-1*var(--swc-overlay-animation-distance))}.dialog[actual-placement*=bottom]{padding-block:var(--swc-overlay-animation-distance);margin-top:calc(-1*var(--swc-overlay-animation-distance))}.dialog[actual-placement*=left]{padding-inline:var(--swc-overlay-animation-distance);margin-left:var(--swc-overlay-animation-distance)}slot[name=longpress-describedby-descriptor]{display:none}@supports selector(:open){.dialog{opacity:0}.dialog:open{opacity:1;--mod-popover-filter:var(--spectrum-popover-filter)}}@supports selector(:popover-open){.dialog{opacity:0}.dialog:popover-open{opacity:1;--mod-popover-filter:var(--spectrum-popover-filter)}}@supports (overlay:auto){.dialog{transition:all var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s)),translate 0s,display var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s));transition-behavior:allow-discrete;display:none}.dialog:popover-open,.dialog:modal{display:flex}}@supports (not selector(:open)) and (not selector(:popover-open)){:host:not([open]) .dialog{pointer-events:none}.dialog[actual-placement]{z-index:calc(var(--swc-overlay-z-index-base,1000) + var(--swc-overlay-open-count))}}
`;
    overlay_css_default = o22;
  }
});

// ../node_modules/@spectrum-web-components/overlay/src/Overlay.js
var Overlay_exports = {};
__export(Overlay_exports, {
  LONGPRESS_INSTRUCTIONS: () => LONGPRESS_INSTRUCTIONS,
  Overlay: () => Overlay
});
var b4, E2, r10, B2, p12, i17, Overlay;
var init_Overlay = __esm({
  "../node_modules/@spectrum-web-components/overlay/src/Overlay.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_ElementResolution();
    init_directives();
    init_random_id();
    init_AbstractOverlay();
    init_OverlayDialog();
    init_OverlayPopover();
    init_OverlayNoPopover();
    init_OverlayStack();
    init_VirtualTrigger();
    init_PlacementController();
    init_LongpressController();
    init_strategies();
    init_slottable_request_event();
    init_overlay_css();
    b4 = Object.defineProperty;
    E2 = Object.getOwnPropertyDescriptor;
    r10 = (u14, a10, e22, t16) => {
      for (var o26 = t16 > 1 ? void 0 : t16 ? E2(a10, e22) : a10, s14 = u14.length - 1, l14; s14 >= 0; s14--) (l14 = u14[s14]) && (o26 = (t16 ? l14(a10, e22, o26) : l14(o26)) || o26);
      return t16 && o26 && b4(a10, e22, o26), o26;
    };
    B2 = "showPopover" in document.createElement("div");
    p12 = OverlayDialog(AbstractOverlay);
    B2 ? p12 = OverlayPopover(p12) : p12 = OverlayNoPopover(p12);
    i17 = class i18 extends p12 {
      constructor() {
        super(...arguments);
        this._delayed = false;
        this._disabled = false;
        this.offset = 0;
        this._open = false;
        this.lastRequestSlottableState = false;
        this.receivesFocus = "auto";
        this._state = "closed";
        this.triggerElement = null;
        this.type = "auto";
        this.wasOpen = false;
        this.closeOnFocusOut = (e22) => {
          if (!e22.relatedTarget) return;
          const t16 = new Event("overlay-relation-query", { bubbles: true, composed: true });
          e22.relatedTarget.addEventListener(t16.type, (o26) => {
            o26.composedPath().includes(this) || (this.open = false);
          }), e22.relatedTarget.dispatchEvent(t16);
        };
      }
      get delayed() {
        var e22;
        return ((e22 = this.elements.at(-1)) == null ? void 0 : e22.hasAttribute("delayed")) || this._delayed;
      }
      set delayed(e22) {
        this._delayed = e22;
      }
      get disabled() {
        return this._disabled;
      }
      set disabled(e22) {
        var t16;
        this._disabled = e22, e22 ? ((t16 = this.strategy) == null || t16.abort(), this.wasOpen = this.open, this.open = false) : (this.bindEvents(), this.open = this.open || this.wasOpen, this.wasOpen = false);
      }
      get hasNonVirtualTrigger() {
        return !!this.triggerElement && !(this.triggerElement instanceof VirtualTrigger);
      }
      get placementController() {
        return this._placementController || (this._placementController = new PlacementController(this)), this._placementController;
      }
      get open() {
        return this._open;
      }
      set open(e22) {
        var t16;
        e22 && this.disabled || e22 !== this.open && ((t16 = this.strategy) != null && t16.activelyOpening && !e22 || (this._open = e22, this.open && (i18.openCount += 1), this.requestUpdate("open", !this.open), this.open && this.requestSlottable()));
      }
      get state() {
        return this._state;
      }
      set state(e22) {
        var o26;
        if (e22 === this.state) return;
        const t16 = this.state;
        this._state = e22, (this.state === "opened" || this.state === "closed") && ((o26 = this.strategy) == null || o26.shouldCompleteOpen()), this.requestUpdate("state", t16);
      }
      get elementResolver() {
        return this._elementResolver || (this._elementResolver = new ElementResolutionController(this)), this._elementResolver;
      }
      get usesDialog() {
        return this.type === "modal" || this.type === "page";
      }
      get popoverValue() {
        if ("popover" in this) switch (this.type) {
          case "modal":
          case "page":
            return;
          case "hint":
            return "manual";
          default:
            return this.type;
        }
      }
      get requiresPosition() {
        return !(this.type === "page" || !this.open || !this.triggerElement || !this.placement && this.type !== "hint");
      }
      managePosition() {
        if (!this.requiresPosition || !this.open) return;
        const e22 = this.offset || 0, t16 = this.triggerElement, o26 = this.placement || "right", s14 = this.tipPadding;
        this.placementController.placeOverlay(this.dialogEl, { offset: e22, placement: o26, tipPadding: s14, trigger: t16, type: this.type });
      }
      async managePopoverOpen() {
        super.managePopoverOpen();
        const e22 = this.open;
        if (this.open !== e22 || (await this.manageDelay(e22), this.open !== e22) || (await this.ensureOnDOM(e22), this.open !== e22)) return;
        const t16 = await this.makeTransition(e22);
        this.open === e22 && await this.applyFocus(e22, t16);
      }
      async applyFocus(e22, t16) {
        if (!(this.receivesFocus === "false" || this.type === "hint")) {
          if (await nextFrame(), await nextFrame(), e22 === this.open && !this.open) {
            this.hasNonVirtualTrigger && this.contains(this.getRootNode().activeElement) && this.triggerElement.focus();
            return;
          }
          t16 == null || t16.focus();
        }
      }
      returnFocus() {
        var t16;
        if (this.open || this.type === "hint") return;
        const e22 = () => {
          var l14, m10;
          const o26 = [];
          let s14 = document.activeElement;
          for (; (l14 = s14 == null ? void 0 : s14.shadowRoot) != null && l14.activeElement; ) s14 = s14.shadowRoot.activeElement;
          for (; s14; ) {
            const h11 = s14.assignedSlot || s14.parentElement || ((m10 = s14.getRootNode()) == null ? void 0 : m10.host);
            h11 && o26.push(h11), s14 = h11;
          }
          return o26;
        };
        this.receivesFocus !== "false" && ((t16 = this.triggerElement) != null && t16.focus) && (this.contains(this.getRootNode().activeElement) || e22().includes(this) || document.activeElement === document.body) && this.triggerElement.focus();
      }
      async manageOpen(e22) {
        if (!(!this.isConnected && this.open) && (this.hasUpdated || await this.updateComplete, this.open ? (overlayStack.add(this), this.willPreventClose && (document.addEventListener("pointerup", () => {
          this.dialogEl.classList.toggle("not-immediately-closable", false), this.willPreventClose = false;
        }, { once: true }), this.dialogEl.classList.toggle("not-immediately-closable", true))) : (e22 && this.dispose(), overlayStack.remove(this)), this.open && this.state !== "opened" ? this.state = "opening" : !this.open && this.state !== "closed" && (this.state = "closing"), this.usesDialog ? this.manageDialogOpen() : this.managePopoverOpen(), this.type === "auto")) {
          const t16 = this.getRootNode();
          this.open ? t16.addEventListener("focusout", this.closeOnFocusOut, { capture: true }) : t16.removeEventListener("focusout", this.closeOnFocusOut, { capture: true });
        }
      }
      bindEvents() {
        var e22;
        (e22 = this.strategy) == null || e22.abort(), this.strategy = void 0, this.hasNonVirtualTrigger && this.triggerInteraction && (this.strategy = new strategies[this.triggerInteraction](this.triggerElement, { overlay: this }));
      }
      handleBeforetoggle(e22) {
        e22.newState !== "open" && this.handleBrowserClose();
      }
      handleBrowserClose() {
        var e22;
        if (!((e22 = this.strategy) != null && e22.activelyOpening)) {
          this.open = false;
          return;
        }
        this.manuallyKeepOpen();
      }
      manuallyKeepOpen() {
        this.open = true, this.placementController.allowPlacementUpdate = true, this.manageOpen(false);
      }
      handleSlotchange() {
        var e22, t16;
        this.elements.length ? this.hasNonVirtualTrigger && ((t16 = this.strategy) == null || t16.prepareDescription(this.triggerElement)) : (e22 = this.strategy) == null || e22.releaseDescription();
      }
      shouldPreventClose() {
        const e22 = this.willPreventClose;
        return this.willPreventClose = false, e22;
      }
      requestSlottable() {
        this.lastRequestSlottableState !== this.open && (this.open || document.body.offsetHeight, this.dispatchEvent(new SlottableRequestEvent("overlay-content", this.open ? {} : removeSlottableRequest)), this.lastRequestSlottableState = this.open);
      }
      willUpdate(e22) {
        var o26;
        if (this.hasAttribute("id") || this.setAttribute("id", `${this.tagName.toLowerCase()}-${randomID()}`), e22.has("open") && (this.hasUpdated || this.open) && this.manageOpen(e22.get("open")), e22.has("trigger")) {
          const [s14, l14] = ((o26 = this.trigger) == null ? void 0 : o26.split("@")) || [];
          this.elementResolver.selector = s14 ? `#${s14}` : "", this.triggerInteraction = l14;
        }
        let t16 = false;
        e22.has(elementResolverUpdatedSymbol) && (t16 = this.triggerElement, this.triggerElement = this.elementResolver.element), e22.has("triggerElement") && (t16 = e22.get("triggerElement")), t16 !== false && this.bindEvents();
      }
      updated(e22) {
        super.updated(e22), e22.has("placement") && (this.placement ? this.dialogEl.setAttribute("actual-placement", this.placement) : this.dialogEl.removeAttribute("actual-placement"), this.open && typeof e22.get("placement") != "undefined" && this.placementController.resetOverlayPosition()), e22.has("state") && this.state === "closed" && typeof e22.get("state") != "undefined" && this.placementController.clearOverlayPosition();
      }
      renderContent() {
        return x`
            <slot @slotchange=${this.handleSlotchange}></slot>
        `;
      }
      get dialogStyleMap() {
        return { "--swc-overlay-open-count": i18.openCount.toString() };
      }
      renderDialog() {
        return x`
            <dialog
                class="dialog"
                part="dialog"
                placement=${l6(this.requiresPosition ? this.placement || "right" : void 0)}
                style=${o10(this.dialogStyleMap)}
                @close=${this.handleBrowserClose}
                @cancel=${this.handleBrowserClose}
                @beforetoggle=${this.handleBeforetoggle}
                ?is-visible=${this.state !== "closed"}
            >
                ${this.renderContent()}
            </dialog>
        `;
      }
      renderPopover() {
        return x`
            <div
                class="dialog"
                part="dialog"
                placement=${l6(this.requiresPosition ? this.placement || "right" : void 0)}
                popover=${l6(this.popoverValue)}
                style=${o10(this.dialogStyleMap)}
                @beforetoggle=${this.handleBeforetoggle}
                @close=${this.handleBrowserClose}
                ?is-visible=${this.state !== "closed"}
            >
                ${this.renderContent()}
            </div>
        `;
      }
      render() {
        const e22 = this.type === "modal" || this.type === "page";
        return x`
            ${e22 ? this.renderDialog() : this.renderPopover()}
            <slot name="longpress-describedby-descriptor"></slot>
        `;
      }
      connectedCallback() {
        super.connectedCallback(), this.addEventListener("close", () => {
          this.open = false;
        }), this.hasUpdated && this.bindEvents();
      }
      disconnectedCallback() {
        var e22;
        (e22 = this.strategy) == null || e22.releaseDescription(), this.open = false, super.disconnectedCallback();
      }
    };
    i17.styles = [overlay_css_default], i17.openCount = 1, r10([n7({ type: Boolean })], i17.prototype, "delayed", 1), r10([i5(".dialog")], i17.prototype, "dialogEl", 2), r10([n7({ type: Boolean })], i17.prototype, "disabled", 1), r10([l5({ flatten: true, selector: ':not([slot="longpress-describedby-descriptor"], slot)' })], i17.prototype, "elements", 2), r10([n7({ type: Number })], i17.prototype, "offset", 2), r10([n7({ type: Boolean, reflect: true })], i17.prototype, "open", 1), r10([n7()], i17.prototype, "placement", 2), r10([n7({ attribute: "receives-focus" })], i17.prototype, "receivesFocus", 2), r10([i5("slot")], i17.prototype, "slotEl", 2), r10([t4()], i17.prototype, "state", 1), r10([n7({ type: Number, attribute: "tip-padding" })], i17.prototype, "tipPadding", 2), r10([n7()], i17.prototype, "trigger", 2), r10([n7({ attribute: false })], i17.prototype, "triggerElement", 2), r10([n7({ attribute: false })], i17.prototype, "triggerInteraction", 2), r10([n7()], i17.prototype, "type", 2);
    Overlay = i17;
  }
});

// ../node_modules/@spectrum-web-components/overlay/sp-overlay.js
var sp_overlay_exports = {};
var init_sp_overlay = __esm({
  "../node_modules/@spectrum-web-components/overlay/sp-overlay.js"() {
    "use strict";
    init_define_element();
    init_Overlay();
    defineElement("sp-overlay", Overlay);
  }
});

// ../node_modules/@spectrum-web-components/popover/src/popover.css.js
var o23, popover_css_default;
var init_popover_css = __esm({
  "../node_modules/@spectrum-web-components/popover/src/popover.css.js"() {
    "use strict";
    init_src();
    o23 = i3`
    :host{pointer-events:none;visibility:hidden;opacity:0;transition:transform var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,opacity var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,visibility 0s linear var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))}:host([open]){pointer-events:auto;visibility:visible;opacity:1;transition-delay:var(--mod-overlay-animation-duration-opened,var(--spectrum-animation-duration-0,0s))}:host{--flow-direction:1;--spectrum-popover-animation-distance:var(--spectrum-spacing-100);--spectrum-popover-background-color:var(--spectrum-background-layer-2-color);--spectrum-popover-border-color:var(--spectrum-gray-400);--spectrum-popover-content-area-spacing-vertical:var(--spectrum-popover-top-to-content-area);--spectrum-popover-shadow-horizontal:var(--spectrum-drop-shadow-x);--spectrum-popover-shadow-vertical:var(--spectrum-drop-shadow-y);--spectrum-popover-shadow-blur:var(--spectrum-drop-shadow-blur);--spectrum-popover-shadow-color:var(--spectrum-drop-shadow-color);--spectrum-popover-corner-radius:var(--spectrum-corner-radius-100);--spectrum-popover-pointer-width:var(--spectrum-popover-tip-width);--spectrum-popover-pointer-height:var(--spectrum-popover-tip-height);--spectrum-popover-pointer-edge-offset:calc(var(--spectrum-corner-radius-100) + var(--spectrum-popover-tip-width)/2);--spectrum-popover-pointer-edge-spacing:calc(var(--spectrum-popover-pointer-edge-offset) - var(--spectrum-popover-tip-width)/2)}:host:dir(rtl),:host([dir=rtl]){--flow-direction:-1}@media (forced-colors:active){:host{--highcontrast-popover-border-color:CanvasText}}:host{--spectrum-popover-filter:drop-shadow(var(--mod-popover-shadow-horizontal,var(--spectrum-popover-shadow-horizontal))var(--mod-popover-shadow-vertical,var(--spectrum-popover-shadow-vertical))var(--mod-popover-shadow-blur,var(--spectrum-popover-shadow-blur))var(--mod-popover-shadow-color,var(--spectrum-popover-shadow-color)));box-sizing:border-box;padding:var(--mod-popover-content-area-spacing-vertical,var(--spectrum-popover-content-area-spacing-vertical))0;border-radius:var(--mod-popover-corner-radius,var(--spectrum-popover-corner-radius));border-style:solid;border-color:var(--highcontrast-popover-border-color,var(--mod-popover-border-color,var(--spectrum-popover-border-color)));border-width:var(--mod-popover-border-width,var(--spectrum-popover-border-width));background-color:var(--mod-popover-background-color,var(--spectrum-popover-background-color));filter:var(--mod-popover-filter,var(--spectrum-popover-filter));outline:none;flex-direction:column;display:inline-flex;position:absolute}:host([tip]) #tip .triangle{stroke-linecap:square;stroke-linejoin:miter;fill:var(--highcontrast-popover-background-color,var(--mod-popover-background-color,var(--spectrum-popover-background-color)));stroke:var(--highcontrast-popover-border-color,var(--mod-popover-border-color,var(--spectrum-popover-border-color)));stroke-width:var(--mod-popover-border-width,var(--spectrum-popover-border-width))}*{--mod-popover-filter:none}:host([tip]) .spectrum-Popover--top-end,:host([tip]) .spectrum-Popover--top-left,:host([tip]) .spectrum-Popover--top-right,:host([tip]) .spectrum-Popover--top-start,:host([placement*=top][tip]){margin-block-end:calc(var(--mod-popover-pointer-height,var(--spectrum-popover-pointer-height)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--top-end,:host([open]) .spectrum-Popover--top-left,:host([open]) .spectrum-Popover--top-right,:host([open]) .spectrum-Popover--top-start,:host([placement*=top][open]){transform:translateY(calc(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance))*-1))}:host([tip]) .spectrum-Popover--bottom-end,:host([tip]) .spectrum-Popover--bottom-left,:host([tip]) .spectrum-Popover--bottom-right,:host([tip]) .spectrum-Popover--bottom-start,:host([placement*=bottom][tip]){margin-block-start:calc(var(--mod-popover-pointer-height,var(--spectrum-popover-pointer-height)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--bottom-end,:host([open]) .spectrum-Popover--bottom-left,:host([open]) .spectrum-Popover--bottom-right,:host([open]) .spectrum-Popover--bottom-start,:host([placement*=bottom][open]){transform:translateY(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance)))}:host([tip]) .spectrum-Popover--right-bottom,:host([tip]) .spectrum-Popover--right-top,:host([placement*=right][tip]){margin-inline-start:calc(var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--right-bottom,:host([open]) .spectrum-Popover--right-top,:host([placement*=right][open]){transform:translateX(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance)))}:host([tip]) .spectrum-Popover--left-bottom,:host([tip]) .spectrum-Popover--left-top,:host([placement*=left][tip]){margin-inline-end:calc(var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--left-bottom,:host([open]) .spectrum-Popover--left-top,:host([placement*=left][open]){transform:translateX(calc(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance))*-1))}:host([tip]) .spectrum-Popover--start-bottom,:host([tip]) .spectrum-Popover--start-top,:host([tip]) .spectrum-Popover--start{margin-inline-end:calc(var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--start-bottom,:host([open]) .spectrum-Popover--start-top,:host([open]) .spectrum-Popover--start{transform:translateX(calc(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance))*-1))}:host([open]) .spectrum-Popover--start-bottom:dir(rtl),:host([open]) .spectrum-Popover--start-top:dir(rtl),:host([open]) .spectrum-Popover--start:dir(rtl),:host([dir=rtl][open]) .spectrum-Popover--start-bottom,:host([dir=rtl][open]) .spectrum-Popover--start-top,:host([dir=rtl][open]) .spectrum-Popover--start{transform:translateX(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance)))}:host([tip]) .spectrum-Popover--end-bottom,:host([tip]) .spectrum-Popover--end-top,:host([tip]) .spectrum-Popover--end{margin-inline-start:calc(var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width)) - var(--mod-popover-border-width,var(--spectrum-popover-border-width)))}:host([open]) .spectrum-Popover--end-bottom,:host([open]) .spectrum-Popover--end-top,:host([open]) .spectrum-Popover--end{transform:translateX(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance)))}:host([open]) .spectrum-Popover--end-bottom:dir(rtl),:host([open]) .spectrum-Popover--end-top:dir(rtl),:host([open]) .spectrum-Popover--end:dir(rtl),:host([dir=rtl][open]) .spectrum-Popover--end-bottom,:host([dir=rtl][open]) .spectrum-Popover--end-top,:host([dir=rtl][open]) .spectrum-Popover--end{transform:translateX(calc(var(--mod-popover-animation-distance,var(--spectrum-popover-animation-distance))*-1))}:host([tip]) #tip,:host([tip][placement*=bottom]) #tip,:host([tip]) .spectrum-Popover--bottom-end #tip,:host([tip]) .spectrum-Popover--bottom-left #tip,:host([tip]) .spectrum-Popover--bottom-right #tip,:host([tip]) .spectrum-Popover--bottom-start #tip,:host([tip][placement*=top]) #tip,:host([tip]) .spectrum-Popover--top-end #tip,:host([tip]) .spectrum-Popover--top-left #tip,:host([tip]) .spectrum-Popover--top-right #tip,:host([tip]) .spectrum-Popover--top-start #tip{inline-size:var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width));block-size:var(--mod-popover-pointer-height,var(--spectrum-popover-pointer-height));margin:auto;position:absolute;inset-block-start:100%;inset-inline:0;transform:translate(0)}:host([tip]) .spectrum-Popover--top-left #tip{inset-inline:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))auto}:host([tip]) .spectrum-Popover--top-right #tip{inset-inline:auto var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--top-start #tip{margin-inline-start:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--top-end #tip{margin-inline-end:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip][placement*=bottom]) #tip,:host([tip]) .spectrum-Popover--bottom-end #tip,:host([tip]) .spectrum-Popover--bottom-left #tip,:host([tip]) .spectrum-Popover--bottom-right #tip,:host([tip]) .spectrum-Popover--bottom-start #tip{inset-block:auto 100%;transform:scaleY(-1)}:host([tip]) .spectrum-Popover--bottom-left #tip{inset-inline:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))auto}:host([tip]) .spectrum-Popover--bottom-right #tip{inset-inline:auto var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--bottom-start #tip{margin-inline-start:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--bottom-end #tip{margin-inline-end:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--end #tip,:host([tip]) .spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-top #tip,:host([tip][placement*=left]) #tip,:host([tip]) .spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-top #tip,:host([tip][placement*=right]) #tip,:host([tip]) .spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--start #tip,:host([tip]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-top #tip{inline-size:var(--mod-popover-pointer-height,var(--spectrum-popover-pointer-height));block-size:var(--mod-popover-pointer-width,var(--spectrum-popover-pointer-width));inset-block:0}:host([tip][placement*=left]) .spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--end #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--left-top #tip,:host([tip][placement*=left][placement*=left]) #tip,:host([tip][placement*=left]) .spectrum-Popover--left-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--left-top #tip,:host([tip][placement*=right][placement*=left]) #tip,:host([tip][placement*=right]) .spectrum-Popover--left-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--start #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--left-top #tip{inset-inline:100% auto}:host([tip][placement*=right]) .spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--end #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--right-top #tip,:host([tip][placement*=left][placement*=right]) #tip,:host([tip][placement*=left]) .spectrum-Popover--right-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--right-top #tip,:host([tip][placement*=right][placement*=right]) #tip,:host([tip][placement*=right]) .spectrum-Popover--right-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--start #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--right-top #tip{inset-inline:auto 100%;transform:scaleX(-1)}:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--start-top #tip,:host([tip][placement*=left]) .spectrum-Popover--end-top #tip,:host([tip][placement*=left]) .spectrum-Popover--left-top #tip,:host([tip][placement*=left]) .spectrum-Popover--right-top #tip,:host([tip][placement*=left]) .spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--start-top #tip,:host([tip][placement*=right]) .spectrum-Popover--end-top #tip,:host([tip][placement*=right]) .spectrum-Popover--left-top #tip,:host([tip][placement*=right]) .spectrum-Popover--right-top #tip,:host([tip][placement*=right]) .spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--start-top #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--end-top #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--left-top #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--right-top #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--start-top #tip{inset-block:var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))auto}:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end-bottom.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end-top.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--end.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--left-bottom.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--left-top.spectrum-Popover--start-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--end-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--left-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--right-bottom #tip,:host([tip][placement*=left]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-bottom.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--right-top.spectrum-Popover--start-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--end-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--left-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--right-bottom #tip,:host([tip][placement*=right]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start-bottom.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start-top.spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--left-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--right-bottom #tip,:host([tip]) .spectrum-Popover--start.spectrum-Popover--start-bottom #tip{inset-block:auto var(--mod-popover-pointer-edge-spacing,var(--spectrum-popover-pointer-edge-spacing))}:host([tip]) .spectrum-Popover--start #tip,:host([tip]) .spectrum-Popover--start-bottom #tip,:host([tip]) .spectrum-Popover--start-top #tip{margin-inline-start:100%}:host([tip]) .spectrum-Popover--start #tip:dir(rtl),:host([tip]) .spectrum-Popover--start-bottom #tip:dir(rtl),:host([tip]) .spectrum-Popover--start-top #tip:dir(rtl),:host([dir=rtl][tip]) .spectrum-Popover--start #tip,:host([dir=rtl][tip]) .spectrum-Popover--start-bottom #tip,:host([dir=rtl][tip]) .spectrum-Popover--start-top #tip{transform:scaleX(-1)}:host([tip]) .spectrum-Popover--end #tip,:host([tip]) .spectrum-Popover--end-bottom #tip,:host([tip]) .spectrum-Popover--end-top #tip{margin-inline-end:100%;transform:scaleX(-1)}:host([tip]) .spectrum-Popover--end #tip:dir(rtl),:host([tip]) .spectrum-Popover--end-bottom #tip:dir(rtl),:host([tip]) .spectrum-Popover--end-top #tip:dir(rtl),:host([dir=rtl][tip]) .spectrum-Popover--end #tip,:host([dir=rtl][tip]) .spectrum-Popover--end-bottom #tip,:host([dir=rtl][tip]) .spectrum-Popover--end-top #tip{transform:scaleX(1)}:host{--spectrum-popover-border-width:var(--system-spectrum-popover-border-width)}:host{clip-path:none;min-width:min-content;max-width:100%;max-height:100%}::slotted(*){overscroll-behavior:contain}:host([placement*=left]) #tip[style],:host([placement*=right]) #tip[style]{inset-block-end:auto}:host([placement*=top]) #tip[style],:host([placement*=bottom]) #tip[style]{inset-inline-end:auto}.block,.inline{width:100%;height:100%;display:block}:host([placement*=left]) .block,:host([placement*=right]) .block,:host([placement*=top]) .inline,:host([placement*=bottom]) .inline{display:none}::slotted(.visually-hidden){clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:0 -1px -1px 0;padding:0;position:absolute;overflow:hidden}::slotted(sp-menu){margin:0}:host([dialog]){min-width:var(--mod-popover-dialog-min-width,var(--spectrum-popover-dialog-min-width,270px));padding:var(--mod-popover-dialog-padding,var(--spectrum-popover-dialog-padding,30px 29px))}:host([tip][placement]) #tip{height:auto}
`;
    popover_css_default = o23;
  }
});

// ../node_modules/@spectrum-web-components/popover/src/Popover.js
var c15, d9, t12, Popover;
var init_Popover = __esm({
  "../node_modules/@spectrum-web-components/popover/src/Popover.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_popover_css();
    c15 = Object.defineProperty;
    d9 = Object.getOwnPropertyDescriptor;
    t12 = (o26, r16, l14, p18) => {
      for (var e22 = p18 > 1 ? void 0 : p18 ? d9(r16, l14) : r16, i20 = o26.length - 1, a10; i20 >= 0; i20--) (a10 = o26[i20]) && (e22 = (p18 ? a10(r16, l14, e22) : a10(e22)) || e22);
      return p18 && e22 && c15(r16, l14, e22), e22;
    };
    Popover = class extends SpectrumElement {
      constructor() {
        super(...arguments);
        this.dialog = false;
        this.open = false;
        this.tip = false;
      }
      static get styles() {
        return [popover_css_default];
      }
      renderTip() {
        return x`
            <div id="tip" aria-hidden="true">
                <svg class="tip block" viewBox="0 -0.5 16 9">
                    <path class="triangle" d="M-1,-1 8,8 17,-1"></path>
                </svg>
                <svg class="tip inline" viewBox="0 -0.5 9 16">
                    <path class="triangle" d="M-1,-1 8,8 -1,17"></path>
                </svg>
            </div>
        `;
      }
      update(l14) {
        super.update(l14);
      }
      render() {
        return x`
            <slot></slot>
            ${this.tip ? this.renderTip() : A}
        `;
      }
    };
    t12([n7({ type: Boolean, reflect: true })], Popover.prototype, "dialog", 2), t12([n7({ type: Boolean, reflect: true })], Popover.prototype, "open", 2), t12([n7({ reflect: true })], Popover.prototype, "placement", 2), t12([n7({ type: Boolean, reflect: true })], Popover.prototype, "tip", 2), t12([i5("#tip")], Popover.prototype, "tipElement", 2);
  }
});

// ../node_modules/@spectrum-web-components/popover/sp-popover.js
var sp_popover_exports = {};
var init_sp_popover = __esm({
  "../node_modules/@spectrum-web-components/popover/sp-popover.js"() {
    "use strict";
    init_Popover();
    init_define_element();
    defineElement("sp-popover", Popover);
  }
});

// ../node_modules/@spectrum-web-components/reactive-controllers/src/MatchMedia.js
var IS_MOBILE, MatchMediaController;
var init_MatchMedia = __esm({
  "../node_modules/@spectrum-web-components/reactive-controllers/src/MatchMedia.js"() {
    "use strict";
    IS_MOBILE = "(max-width: 700px) and (hover: none) and (pointer: coarse), (max-height: 700px) and (hover: none) and (pointer: coarse)";
    MatchMediaController = class {
      constructor(e22, t16) {
        this.key = Symbol("match-media-key");
        this.matches = false;
        this.host = e22, this.host.addController(this), this.media = window.matchMedia(t16), this.matches = this.media.matches, this.onChange = this.onChange.bind(this), e22.addController(this);
      }
      hostConnected() {
        var e22;
        (e22 = this.media) == null || e22.addEventListener("change", this.onChange);
      }
      hostDisconnected() {
        var e22;
        (e22 = this.media) == null || e22.removeEventListener("change", this.onChange);
      }
      onChange(e22) {
        this.matches !== e22.matches && (this.matches = e22.matches, this.host.requestUpdate(this.key, !this.matches));
      }
    };
  }
});

// ../node_modules/@spectrum-web-components/underlay/src/underlay.css.js
var n16, underlay_css_default;
var init_underlay_css = __esm({
  "../node_modules/@spectrum-web-components/underlay/src/underlay.css.js"() {
    "use strict";
    init_src();
    n16 = i3`
    :host{pointer-events:none;visibility:hidden;opacity:0;transition:transform var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,opacity var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,visibility 0s linear var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))}:host([open]){pointer-events:auto;visibility:visible;opacity:1;transition-delay:var(--mod-overlay-animation-duration-opened,var(--spectrum-animation-duration-0,0s))}:host{--spectrum-underlay-background-entry-animation-delay:var(--spectrum-animation-duration-0);--spectrum-underlay-background-exit-animation-ease:var(--spectrum-animation-ease-in);--spectrum-underlay-background-entry-animation-ease:var(--spectrum-animation-ease-out);--spectrum-underlay-background-exit-animation-duration:var(--spectrum-animation-duration-300);--spectrum-underlay-background-entry-animation-duration:var(--spectrum-animation-duration-600);--spectrum-underlay-background-exit-animation-delay:var(--spectrum-animation-duration-200);--spectrum-underlay-background-color:rgba(var(--spectrum-black-rgb),var(--spectrum-overlay-opacity));background-color:var(--mod-underlay-background-color,var(--spectrum-underlay-background-color));z-index:1;transition:opacity var(--mod-underlay-background-exit-animation-duration,var(--spectrum-underlay-background-exit-animation-duration))var(--mod-underlay-background-exit-animation-ease,var(--spectrum-underlay-background-exit-animation-ease))var(--mod-underlay-background-exit-animation-delay,var(--spectrum-underlay-background-exit-animation-delay)),visibility 0s linear calc(var(--mod-underlay-background-exit-animation-delay,var(--spectrum-underlay-background-exit-animation-delay)) + var(--mod-underlay-background-exit-animation-duration,var(--spectrum-underlay-background-exit-animation-duration)));position:fixed;inset-block:0;inset-inline:0;overflow:hidden}:host([open]){transition:opacity var(--mod-underlay-background-entry-animation-duration,var(--spectrum-underlay-background-entry-animation-duration))var(--mod-underlay-background-entry-animation-ease,var(--spectrum-underlay-background-entry-animation-ease))var(--mod-underlay-background-entry-animation-delay,var(--spectrum-underlay-background-entry-animation-delay))}
`;
    underlay_css_default = n16;
  }
});

// ../node_modules/@spectrum-web-components/underlay/src/Underlay.js
var d10, p15, s13, Underlay;
var init_Underlay = __esm({
  "../node_modules/@spectrum-web-components/underlay/src/Underlay.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_underlay_css();
    d10 = Object.defineProperty;
    p15 = Object.getOwnPropertyDescriptor;
    s13 = (i20, t16, o26, r16) => {
      for (var e22 = r16 > 1 ? void 0 : r16 ? p15(t16, o26) : t16, n18 = i20.length - 1, l14; n18 >= 0; n18--) (l14 = i20[n18]) && (e22 = (r16 ? l14(t16, o26, e22) : l14(e22)) || e22);
      return r16 && e22 && d10(t16, o26, e22), e22;
    };
    Underlay = class extends SpectrumElement {
      constructor() {
        super(...arguments);
        this.canClick = false;
        this.open = false;
      }
      static get styles() {
        return [underlay_css_default];
      }
      click() {
        this.dispatchEvent(new Event("close"));
      }
      handlePointerdown() {
        this.canClick = true;
      }
      handlePointerup() {
        this.canClick && this.click(), this.canClick = false;
      }
      render() {
        return x``;
      }
      firstUpdated() {
        this.addEventListener("pointerdown", this.handlePointerdown), this.addEventListener("pointerup", this.handlePointerup);
      }
    };
    s13([n7({ type: Boolean, reflect: true })], Underlay.prototype, "open", 2);
  }
});

// ../node_modules/@spectrum-web-components/underlay/sp-underlay.js
var init_sp_underlay = __esm({
  "../node_modules/@spectrum-web-components/underlay/sp-underlay.js"() {
    "use strict";
    init_Underlay();
    init_define_element();
    defineElement("sp-underlay", Underlay);
  }
});

// ../node_modules/@spectrum-web-components/modal/src/modal.css.js
var i19, modal_css_default;
var init_modal_css = __esm({
  "../node_modules/@spectrum-web-components/modal/src/modal.css.js"() {
    "use strict";
    init_src();
    i19 = i3`
    .modal{pointer-events:none;visibility:hidden;opacity:0;transition:transform var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,opacity var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))ease-in-out,visibility 0s linear var(--mod-overlay-animation-duration,var(--spectrum-animation-duration-100,.13s))}:host([open]) .modal{pointer-events:auto;visibility:visible;opacity:1;transition-delay:var(--mod-overlay-animation-duration-opened,var(--spectrum-animation-duration-0,0s))}:host{--spectrum-modal-confirm-exit-animation-delay:var(--spectrum-animation-duration-0);--spectrum-modal-fullscreen-margin:32px;--spectrum-modal-max-height:90vh;--spectrum-modal-max-width:90%;--spectrum-modal-background-color:var(--spectrum-gray-100);--spectrum-modal-confirm-border-radius:var(--spectrum-corner-radius-100);--spectrum-modal-confirm-exit-animation-duration:var(--spectrum-animation-duration-100);--spectrum-modal-confirm-entry-animation-duration:var(--spectrum-animation-duration-500);--spectrum-modal-confirm-entry-animation-delay:var(--spectrum-animation-duration-200);--spectrum-modal-transition-animation-duration:var(--spectrum-animation-duration-100)}.modal{transform:translateY(var(--mod-modal-confirm-entry-animation-distance,var(--spectrum-modal-confirm-entry-animation-distance)));z-index:1;max-block-size:var(--mod-modal-max-height,var(--spectrum-modal-max-height));max-inline-size:var(--mod-modal-max-width,var(--spectrum-modal-max-width));background:var(--mod-modal-background-color,var(--spectrum-modal-background-color));border-radius:var(--mod-modal-confirm-border-radius,var(--spectrum-modal-confirm-border-radius));pointer-events:auto;transition:opacity var(--mod-modal-confirm-exit-animation-duration,var(--spectrum-modal-confirm-exit-animation-duration))var(--spectrum-animation-ease-in)var(--mod-modal-confirm-exit-animation-delay,var(--spectrum-modal-confirm-exit-animation-delay)),visibility 0s linear calc(var(--mod-modal-confirm-exit-animation-delay,var(--spectrum-modal-confirm-exit-animation-delay)) + var(--mod-modal-confirm-exit-animation-duration,var(--spectrum-modal-confirm-exit-animation-duration))),transform 0s linear calc(var(--mod-modal-confirm-exit-animation-delay,var(--spectrum-modal-confirm-exit-animation-delay)) + var(--mod-modal-confirm-exit-animation-duration,var(--spectrum-modal-confirm-exit-animation-duration)));outline:none;overflow:hidden}:host([open]) .modal{transition:transform var(--mod-modal-confirm-entry-animation-duration,var(--spectrum-modal-confirm-entry-animation-duration))var(--spectrum-animation-ease-out)var(--mod-modal-confirm-entry-animation-delay,var(--spectrum-modal-confirm-entry-animation-delay)),opacity var(--mod-modal-confirm-entry-animation-duration,var(--spectrum-modal-confirm-entry-animation-duration))var(--spectrum-animation-ease-out)var(--mod-modal-confirm-entry-animation-delay,var(--spectrum-modal-confirm-entry-animation-delay));transform:translateY(0)}@media only screen and (device-height<=350px),only screen and (device-width<=400px){:host([responsive]) .modal{border-radius:0;block-size:100%;max-block-size:100%;inline-size:100%;max-inline-size:100%}}.fullscreen{max-block-size:none;max-inline-size:none;position:fixed;inset-block-start:var(--mod-modal-fullscreen-margin,var(--spectrum-modal-fullscreen-margin));inset-block-end:var(--mod-modal-fullscreen-margin,var(--spectrum-modal-fullscreen-margin));inset-inline-start:var(--mod-modal-fullscreen-margin,var(--spectrum-modal-fullscreen-margin));inset-inline-end:var(--mod-modal-fullscreen-margin,var(--spectrum-modal-fullscreen-margin))}.fullscreenTakeover{box-sizing:border-box;border:none;border-radius:0;max-block-size:none;max-inline-size:none;position:fixed;inset:0}.fullscreenTakeover,:host([open]) .fullscreenTakeover{transform:none}:host{--spectrum-dialog-confirm-exit-animation-duration:var(--swc-test-duration);--spectrum-dialog-confirm-entry-animation-duration:var(--swc-test-duration);--spectrum-modal-confirm-entry-animation-distance:var(--spectrum-dialog-confirm-entry-animation-distance);height:100dvh}.modal{overflow:visible}
`;
    modal_css_default = i19;
  }
});

// ../node_modules/@spectrum-web-components/tray/src/tray.css.js
var r12, tray_css_default;
var init_tray_css = __esm({
  "../node_modules/@spectrum-web-components/tray/src/tray.css.js"() {
    "use strict";
    init_src();
    r12 = i3`
    :host{--spectrum-tray-exit-animation-delay:0s;--spectrum-tray-entry-animation-delay:.16s;--spectrum-tray-max-inline-size:375px;--spectrum-tray-spacing-edge-to-tray-safe-zone:64px;--spectrum-tray-entry-animation-duration:var(--spectrum-animation-duration-500);--spectrum-tray-exit-animation-duration:var(--spectrum-animation-duration-100);--spectrum-tray-corner-radius:var(--spectrum-corner-radius-100);--spectrum-tray-background-color:var(--spectrum-background-layer-2-color);justify-content:center;inline-size:100%;display:flex;position:fixed;inset-block-end:0;inset-inline-start:0}.tray{--mod-modal-max-width:100%;max-block-size:calc(100vh - var(--mod-tray-spacing-edge-to-tray-safe-zone,var(--spectrum-tray-spacing-edge-to-tray-safe-zone)));box-sizing:border-box;border-radius:var(--mod-tray-corner-radius-portrait,0)var(--mod-tray-corner-radius-portrait,0)0 0;transition:opacity var(--mod-tray-exit-animation-duration,var(--spectrum-tray-exit-animation-duration))cubic-bezier(.5,0,1,1)var(--mod-tray-exit-animation-delay,var(--spectrum-tray-exit-animation-delay)),visibility var(--mod-tray-exit-animation-duration,var(--spectrum-tray-exit-animation-duration))linear calc(var(--mod-tray-exit-animation-delay,var(--spectrum-tray-exit-animation-delay)) + var(--mod-tray-exit-animation-duration,var(--spectrum-tray-exit-animation-duration))),transform var(--mod-tray-exit-animation-duration,var(--spectrum-tray-exit-animation-duration))cubic-bezier(.5,0,1,1)var(--mod-tray-exit-animation-delay,var(--spectrum-tray-exit-animation-delay));background-color:var(--highcontrast-tray-background-color,var(--mod-tray-background-color,var(--spectrum-tray-background-color)));outline:none;inline-size:100%;max-inline-size:100%;margin-block-start:var(--mod-tray-spacing-edge-to-tray-safe-zone,var(--spectrum-tray-spacing-edge-to-tray-safe-zone));padding-block-start:var(--mod-tray-top-to-content-area,var(--spectrum-tray-top-to-content-area));padding-block-end:var(--mod-tray-bottom-to-content-area,var(--spectrum-tray-top-to-content-area));overflow:auto;transform:translateY(100%)}:host([open]) .tray{transition:transform var(--mod-tray-entry-animation-duration,var(--spectrum-tray-entry-animation-duration))cubic-bezier(0,0,.4,1)var(--mod-tray-entry-animation-delay,var(--spectrum-tray-entry-animation-delay)),opacity var(--spectrum-tray-entry-animation-duration,var(--mod-tray-entry-animation-duration))cubic-bezier(0,0,.4,1)var(--mod-tray-entry-animation-delay,var(--spectrum-tray-entry-animation-delay));transform:translateY(0)}@media screen and (orientation:landscape){.tray{max-inline-size:var(--mod-tray-max-inline-size,var(--spectrum-tray-max-inline-size));border-start-start-radius:var(--mod-tray-corner-radius,var(--spectrum-tray-corner-radius));border-start-end-radius:var(--mod-tray-corner-radius,var(--spectrum-tray-corner-radius))}}@media (forced-colors:active){.tray{--highcontrast-tray-background-color:Canvas;border:solid}.tray ::slotted(*){border:none}}:host{align-items:flex-end;max-height:100dvh;position:fixed!important}sp-underlay{touch-action:none}.tray{overscroll-behavior:contain;display:inline-flex}::slotted(.visually-hidden){clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:0 -1px -1px 0;padding:0;position:absolute;overflow:hidden}
`;
    tray_css_default = r12;
  }
});

// ../node_modules/@spectrum-web-components/tray/src/Tray.js
var l13, p16, a9, Tray;
var init_Tray = __esm({
  "../node_modules/@spectrum-web-components/tray/src/Tray.js"() {
    "use strict";
    init_src();
    init_decorators2();
    init_sp_underlay();
    init_first_focusable_in();
    init_MatchMedia();
    init_modal_css();
    init_tray_css();
    l13 = Object.defineProperty;
    p16 = Object.getOwnPropertyDescriptor;
    a9 = (o26, r16, e22, i20) => {
      for (var t16 = i20 > 1 ? void 0 : i20 ? p16(r16, e22) : r16, s14 = o26.length - 1, n18; s14 >= 0; s14--) (n18 = o26[s14]) && (t16 = (i20 ? n18(r16, e22, t16) : n18(t16)) || t16);
      return i20 && t16 && l13(r16, e22, t16), t16;
    };
    Tray = class extends SpectrumElement {
      constructor() {
        super(...arguments);
        this.open = false;
        this.prefersMotion = new MatchMediaController(this, "(prefers-reduced-motion: no-preference)");
        this.transitionPromise = Promise.resolve();
        this.animating = false;
      }
      static get styles() {
        return [modal_css_default, tray_css_default];
      }
      focus() {
        const e22 = firstFocusableIn(this);
        e22 ? e22.focus() : this.children.length === 1 ? this.tray.focus() : super.focus();
      }
      overlayWillCloseCallback() {
        return this.open ? (this.close(), true) : this.animating;
      }
      close() {
        this.open = false, this.prefersMotion.matches || this.dispatchClosed();
      }
      dispatchClosed() {
        this.dispatchEvent(new Event("close", { bubbles: true }));
      }
      handleUnderlayTransitionend() {
        this.open || (this.resolveTransitionPromise(), this.dispatchClosed());
      }
      handleTrayTransitionend() {
        this.open && this.resolveTransitionPromise();
      }
      update(e22) {
        e22.has("open") && e22.get("open") !== void 0 && this.prefersMotion.matches && (this.animating = true, this.transitionPromise = new Promise((i20) => {
          this.resolveTransitionPromise = () => {
            this.animating = false, i20();
          };
        })), super.update(e22);
      }
      render() {
        return x`
            <sp-underlay
                ?open=${this.open}
                @close=${this.close}
                @transitionend=${this.handleUnderlayTransitionend}
            ></sp-underlay>
            <div
                class="tray modal"
                tabindex="-1"
                @transitionend=${this.handleTrayTransitionend}
            >
                <slot></slot>
            </div>
        `;
      }
      async getUpdateComplete() {
        const e22 = await super.getUpdateComplete();
        return await this.transitionPromise, e22;
      }
    };
    a9([n7({ type: Boolean, reflect: true })], Tray.prototype, "open", 2), a9([i5(".tray")], Tray.prototype, "tray", 2);
  }
});

// ../node_modules/@spectrum-web-components/tray/sp-tray.js
var sp_tray_exports = {};
var init_sp_tray = __esm({
  "../node_modules/@spectrum-web-components/tray/sp-tray.js"() {
    "use strict";
    init_Tray();
    init_define_element();
    defineElement("sp-tray", Tray);
  }
});

// ../node_modules/@spectrum-web-components/action-button/src/ActionButton.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/button/src/Button.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/button/src/ButtonBase.js
init_src();
init_decorators2();
init_like_anchor();
init_focusable();
init_observe_slot_text();

// ../node_modules/@spectrum-web-components/button/src/button-base.css.js
init_src();
var e11 = i3`
    :host{vertical-align:top;--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-100);--spectrum-icon-size:var(--spectrum-workflow-icon-size-100);display:inline-flex}:host([dir]){-webkit-appearance:none}:host([disabled]){pointer-events:none;cursor:auto}#button{position:absolute;inset:0}::slotted(sp-overlay),::slotted(sp-tooltip){position:absolute}:host:after,::slotted(*){pointer-events:none}slot[name=icon]::slotted(svg),slot[name=icon]::slotted(img){fill:currentColor;stroke:currentColor;block-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-100));inline-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-100))}[icon-only]+#label{display:contents}:host([size=xs]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-50);--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-75);--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=l]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-200);--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-300);--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-progress-circle-size:var(--spectrum-workflow-icon-size-400);--spectrum-icon-size:var(--spectrum-workflow-icon-size-400)}
`;
var button_base_css_default = e11;

// ../node_modules/@spectrum-web-components/button/src/ButtonBase.js
var d5 = Object.defineProperty;
var c9 = Object.getOwnPropertyDescriptor;
var s10 = (n18, i20, e22, t16) => {
  for (var r16 = t16 > 1 ? void 0 : t16 ? c9(i20, e22) : i20, a10 = n18.length - 1, l14; a10 >= 0; a10--) (l14 = n18[a10]) && (r16 = (t16 ? l14(i20, e22, r16) : l14(r16)) || r16);
  return t16 && r16 && d5(i20, e22, r16), r16;
};
var ButtonBase = class extends ObserveSlotText(LikeAnchor(Focusable), "", ["sp-overlay,sp-tooltip"]) {
  constructor() {
    super();
    this.active = false;
    this.type = "button";
    this.proxyFocus = this.proxyFocus.bind(this), this.addEventListener("click", this.handleClickCapture, { capture: true });
  }
  static get styles() {
    return [button_base_css_default];
  }
  get focusElement() {
    return this;
  }
  get hasLabel() {
    return this.slotHasContent;
  }
  get buttonContent() {
    return [x`
                <slot name="icon" ?icon-only=${!this.hasLabel}></slot>
            `, x`
                <span id="label">
                    <slot @slotchange=${this.manageTextObservedSlot}></slot>
                </span>
            `];
  }
  click() {
    this.disabled || this.shouldProxyClick() || super.click();
  }
  handleClickCapture(e22) {
    if (this.disabled) return e22.preventDefault(), e22.stopImmediatePropagation(), e22.stopPropagation(), false;
  }
  proxyFocus() {
    this.focus();
  }
  shouldProxyClick() {
    let e22 = false;
    if (this.anchorElement) this.anchorElement.click(), e22 = true;
    else if (this.type !== "button") {
      const t16 = document.createElement("button");
      t16.type = this.type, this.insertAdjacentElement("afterend", t16), t16.click(), t16.remove(), e22 = true;
    }
    return e22;
  }
  renderAnchor() {
    return x`
            ${this.buttonContent}
            ${super.renderAnchor({ id: "button", ariaHidden: true, className: "button anchor hidden" })}
        `;
  }
  renderButton() {
    return x`
            ${this.buttonContent}
        `;
  }
  render() {
    return this.href && this.href.length > 0 ? this.renderAnchor() : this.renderButton();
  }
  handleKeydown(e22) {
    const { code: t16 } = e22;
    switch (t16) {
      case "Space":
        e22.preventDefault(), typeof this.href == "undefined" && (this.addEventListener("keyup", this.handleKeyup), this.active = true);
        break;
      default:
        break;
    }
  }
  handleKeypress(e22) {
    const { code: t16 } = e22;
    switch (t16) {
      case "Enter":
      case "NumpadEnter":
        this.click();
        break;
      default:
        break;
    }
  }
  handleKeyup(e22) {
    const { code: t16 } = e22;
    switch (t16) {
      case "Space":
        this.removeEventListener("keyup", this.handleKeyup), this.active = false, this.click();
        break;
      default:
        break;
    }
  }
  manageAnchor() {
    this.href && this.href.length > 0 ? ((!this.hasAttribute("role") || this.getAttribute("role") === "button") && this.setAttribute("role", "link"), this.removeEventListener("click", this.shouldProxyClick)) : ((!this.hasAttribute("role") || this.getAttribute("role") === "link") && this.setAttribute("role", "button"), this.addEventListener("click", this.shouldProxyClick));
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.hasAttribute("tabindex") || this.setAttribute("tabindex", "0"), this.manageAnchor(), this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keypress", this.handleKeypress);
  }
  updated(e22) {
    super.updated(e22), e22.has("href") && this.manageAnchor(), e22.has("label") && this.setAttribute("aria-label", this.label || ""), this.anchorElement && (this.anchorElement.addEventListener("focus", this.proxyFocus), this.anchorElement.tabIndex = -1);
  }
};
s10([n7({ type: Boolean, reflect: true })], ButtonBase.prototype, "active", 2), s10([n7({ type: String })], ButtonBase.prototype, "type", 2), s10([i5(".anchor")], ButtonBase.prototype, "anchorElement", 2);

// ../node_modules/@spectrum-web-components/button/src/button.css.js
init_src();
var o14 = i3`
    :host{cursor:pointer;-webkit-user-select:none;user-select:none;box-sizing:border-box;font-family:var(--mod-button-font-family,var(--mod-sans-font-family-stack,var(--spectrum-sans-font-family-stack)));line-height:var(--mod-button-line-height,var(--mod-line-height-100,var(--spectrum-line-height-100)));text-transform:none;vertical-align:top;-webkit-appearance:button;transition:background var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,border-color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,box-shadow var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;justify-content:center;align-items:center;margin:0;-webkit-text-decoration:none;text-decoration:none;display:inline-flex;overflow:visible}:host(:focus){outline:none}:host .is-disabled,:host([disabled]){cursor:default}:host:after{margin:calc(var(--mod-button-focus-indicator-gap,var(--mod-focus-indicator-gap,var(--spectrum-focus-indicator-gap)))*-1);transition:opacity var(--mod-button-animation-duration,var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100))))ease-out,margin var(--mod-button-animation-duration,var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100))))ease-out;display:block;inset-block:0;inset-inline:0}:host(:focus-visible):after{margin:calc(var(--mod-focus-indicator-gap,var(--spectrum-focus-indicator-gap))*-2)}#label{text-align:center;place-self:center}#label[hidden]{display:none}:host{--spectrum-button-animation-duration:var(--spectrum-animation-duration-100);--spectrum-button-border-radius:var(--spectrum-corner-radius-100);--spectrum-button-border-width:var(--spectrum-border-width-200);--spectrum-button-line-height:1.2;--spectrum-button-focus-ring-gap:var(--spectrum-focus-indicator-gap);--spectrum-button-focus-ring-border-radius:calc(var(--spectrum-button-border-radius) + var(--spectrum-button-focus-ring-gap));--spectrum-button-focus-ring-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-button-focus-indicator-color:var(--spectrum-focus-indicator-color);--spectrum-button-intended-icon-size:var(--spectrum-workflow-icon-size-50);--mod-progress-circle-position:absolute}:host([size=s]){--spectrum-button-min-width:calc(var(--spectrum-component-height-75)*var(--spectrum-button-minimum-width-multiplier));--spectrum-button-border-radius:var(--spectrum-component-pill-edge-to-text-75);--spectrum-button-height:var(--spectrum-component-height-75);--spectrum-button-font-size:var(--spectrum-font-size-75);--spectrum-button-edge-to-visual:calc(var(--spectrum-component-pill-edge-to-visual-75) - var(--spectrum-button-border-width));--spectrum-button-edge-to-visual-only:var(--spectrum-component-pill-edge-to-visual-only-75);--spectrum-button-edge-to-text:calc(var(--spectrum-component-pill-edge-to-text-75) - var(--spectrum-button-border-width));--spectrum-button-padding-label-to-icon:var(--spectrum-text-to-visual-75);--spectrum-button-top-to-text:var(--spectrum-button-top-to-text-small);--spectrum-button-bottom-to-text:var(--spectrum-button-bottom-to-text-small);--spectrum-button-top-to-icon:var(--spectrum-component-top-to-workflow-icon-75);--spectrum-button-intended-icon-size:var(--spectrum-workflow-icon-size-75)}:host{--spectrum-button-min-width:calc(var(--spectrum-component-height-100)*var(--spectrum-button-minimum-width-multiplier));--spectrum-button-border-radius:var(--spectrum-component-pill-edge-to-text-100);--spectrum-button-height:var(--spectrum-component-height-100);--spectrum-button-font-size:var(--spectrum-font-size-100);--spectrum-button-edge-to-visual:calc(var(--spectrum-component-pill-edge-to-visual-100) - var(--spectrum-button-border-width));--spectrum-button-edge-to-visual-only:var(--spectrum-component-pill-edge-to-visual-only-100);--spectrum-button-edge-to-text:calc(var(--spectrum-component-pill-edge-to-text-100) - var(--spectrum-button-border-width));--spectrum-button-padding-label-to-icon:var(--spectrum-text-to-visual-100);--spectrum-button-top-to-text:var(--spectrum-button-top-to-text-medium);--spectrum-button-bottom-to-text:var(--spectrum-button-bottom-to-text-medium);--spectrum-button-top-to-icon:var(--spectrum-component-top-to-workflow-icon-100);--spectrum-button-intended-icon-size:var(--spectrum-workflow-icon-size-100)}:host([size=l]){--spectrum-button-min-width:calc(var(--spectrum-component-height-200)*var(--spectrum-button-minimum-width-multiplier));--spectrum-button-border-radius:var(--spectrum-component-pill-edge-to-text-200);--spectrum-button-height:var(--spectrum-component-height-200);--spectrum-button-font-size:var(--spectrum-font-size-200);--spectrum-button-edge-to-visual:calc(var(--spectrum-component-pill-edge-to-visual-200) - var(--spectrum-button-border-width));--spectrum-button-edge-to-visual-only:var(--spectrum-component-pill-edge-to-visual-only-200);--spectrum-button-edge-to-text:calc(var(--spectrum-component-pill-edge-to-text-200) - var(--spectrum-button-border-width));--spectrum-button-padding-label-to-icon:var(--spectrum-text-to-visual-200);--spectrum-button-top-to-text:var(--spectrum-button-top-to-text-large);--spectrum-button-bottom-to-text:var(--spectrum-button-bottom-to-text-large);--spectrum-button-top-to-icon:var(--spectrum-component-top-to-workflow-icon-200);--spectrum-button-intended-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-button-min-width:calc(var(--spectrum-component-height-300)*var(--spectrum-button-minimum-width-multiplier));--spectrum-button-border-radius:var(--spectrum-component-pill-edge-to-text-300);--spectrum-button-height:var(--spectrum-component-height-300);--spectrum-button-font-size:var(--spectrum-font-size-300);--spectrum-button-edge-to-visual:calc(var(--spectrum-component-pill-edge-to-visual-300) - var(--spectrum-button-border-width));--spectrum-button-edge-to-visual-only:var(--spectrum-component-pill-edge-to-visual-only-300);--spectrum-button-edge-to-text:calc(var(--spectrum-component-pill-edge-to-text-300) - var(--spectrum-button-border-width));--spectrum-button-padding-label-to-icon:var(--spectrum-text-to-visual-300);--spectrum-button-top-to-text:var(--spectrum-button-top-to-text-extra-large);--spectrum-button-bottom-to-text:var(--spectrum-button-bottom-to-text-extra-large);--spectrum-button-top-to-icon:var(--spectrum-component-top-to-workflow-icon-300);--spectrum-button-intended-icon-size:var(--spectrum-workflow-icon-size-300)}:host{border-radius:var(--mod-button-border-radius,var(--spectrum-button-border-radius));border-width:var(--mod-button-border-width,var(--spectrum-button-border-width));font-size:var(--mod-button-font-size,var(--spectrum-button-font-size));font-weight:var(--mod-bold-font-weight,var(--spectrum-bold-font-weight));gap:var(--mod-button-padding-label-to-icon,var(--spectrum-button-padding-label-to-icon));min-inline-size:var(--mod-button-min-width,var(--spectrum-button-min-width));min-block-size:var(--mod-button-height,var(--spectrum-button-height));padding-block:0;padding-inline:var(--mod-button-edge-to-text,var(--spectrum-button-edge-to-text));color:inherit;margin-block:var(--mod-button-margin-block);border-style:solid;margin-inline-start:var(--mod-button-margin-left);margin-inline-end:var(--mod-button-margin-right);position:relative}:host(:is(:active,[active])){box-shadow:none}::slotted([slot=icon]){--_icon-size-difference:max(0px,var(--spectrum-button-intended-icon-size) - var(--spectrum-icon-block-size,var(--spectrum-button-intended-icon-size)));color:inherit;flex-shrink:0;align-self:flex-start;margin-block-start:var(--mod-button-icon-margin-block-start,max(0px,var(--mod-button-top-to-icon,var(--spectrum-button-top-to-icon)) - var(--mod-button-border-width,var(--spectrum-button-border-width)) + (var(--_icon-size-difference,0px)/2)));margin-inline-start:calc(var(--mod-button-edge-to-visual,var(--spectrum-button-edge-to-visual)) - var(--mod-button-edge-to-text,var(--spectrum-button-edge-to-text)))}:host:after{border-radius:calc(var(--mod-button-border-radius,var(--spectrum-button-border-radius)) + var(--mod-focus-indicator-gap,var(--spectrum-focus-indicator-gap)))}:host([icon-only]){min-inline-size:unset;padding:calc(var(--mod-button-edge-to-visual-only,var(--spectrum-button-edge-to-visual-only)) - var(--mod-button-border-width,var(--spectrum-button-border-width)));border-radius:50%}:host([icon-only]) ::slotted([slot=icon]){align-self:center;margin-block-start:0;margin-inline-start:0}:host([icon-only]):after{border-radius:50%}#label{line-height:var(--mod-button-line-height,var(--spectrum-button-line-height));text-align:var(--mod-button-text-align,center);align-self:start;padding-block-start:calc(var(--mod-button-top-to-text,var(--spectrum-button-top-to-text)) - var(--mod-button-border-width,var(--spectrum-button-border-width)));padding-block-end:calc(var(--mod-button-bottom-to-text,var(--spectrum-button-bottom-to-text)) - var(--mod-button-border-width,var(--spectrum-button-border-width)))}[name=icon]+#label{text-align:var(--mod-button-text-align-with-icon,start)}:host([focused]):after,:host(:focus-visible):after{box-shadow:0 0 0 var(--mod-button-focus-ring-thickness,var(--spectrum-button-focus-ring-thickness))var(--mod-button-focus-ring-color,var(--spectrum-button-focus-indicator-color))}:host{transition:border-color var(--mod-button-animation-duration,var(--spectrum-button-animation-duration))ease-in-out}:host:after{margin:calc(( var(--mod-button-focus-ring-gap,var(--spectrum-button-focus-ring-gap)) + var(--mod-button-border-width,var(--spectrum-button-border-width)))*-1);border-radius:var(--mod-button-focus-ring-border-radius,var(--spectrum-button-focus-ring-border-radius));transition:box-shadow var(--mod-button-animation-duration,var(--spectrum-button-animation-duration))ease-in-out;pointer-events:none;content:"";position:absolute;inset:0}:host(:focus-visible){box-shadow:none;outline:none}:host(:focus-visible):after{box-shadow:0 0 0 var(--mod-button-focus-ring-thickness,var(--spectrum-button-focus-ring-thickness))var(--highcontrast-button-focus-ring-color,var(--mod-button-focus-ring-color,var(--mod-button-focus-ring-color,var(--spectrum-button-focus-indicator-color))))}:host{background-color:var(--highcontrast-button-background-color-default,var(--mod-button-background-color-default,var(--spectrum-button-background-color-default)));border-color:var(--highcontrast-button-border-color-default,var(--mod-button-border-color-default,var(--spectrum-button-border-color-default)));color:var(--highcontrast-button-content-color-default,var(--mod-button-content-color-default,var(--spectrum-button-content-color-default)));transition:border var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))linear,color var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))linear,background-color var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))linear}@media (hover:hover){:host(:hover){box-shadow:none;background-color:var(--highcontrast-button-background-color-hover,var(--mod-button-background-color-hover,var(--spectrum-button-background-color-hover)));border-color:var(--highcontrast-button-border-color-hover,var(--mod-button-border-color-hover,var(--spectrum-button-border-color-hover)));color:var(--highcontrast-button-content-color-hover,var(--mod-button-content-color-hover,var(--spectrum-button-content-color-hover)))}}:host(:focus-visible){background-color:var(--highcontrast-button-background-color-focus,var(--mod-button-background-color-focus,var(--spectrum-button-background-color-focus)));border-color:var(--highcontrast-button-border-color-focus,var(--mod-button-border-color-focus,var(--spectrum-button-border-color-focus)));color:var(--highcontrast-button-content-color-focus,var(--mod-button-content-color-focus,var(--spectrum-button-content-color-focus)))}:host(:is(:active,[active])){background-color:var(--highcontrast-button-background-color-down,var(--mod-button-background-color-down,var(--spectrum-button-background-color-down)));border-color:var(--highcontrast-button-border-color-down,var(--mod-button-border-color-down,var(--spectrum-button-border-color-down)));color:var(--highcontrast-button-content-color-down,var(--mod-button-content-color-down,var(--spectrum-button-content-color-down)))}:host .is-disabled,:host([pending]),:host([disabled]),:host([pending]){background-color:var(--highcontrast-button-background-color-disabled,var(--mod-button-background-color-disabled,var(--spectrum-button-background-color-disabled)));border-color:var(--highcontrast-button-border-color-disabled,var(--mod-button-border-color-disabled,var(--spectrum-button-border-color-disabled)));color:var(--highcontrast-button-content-color-disabled,var(--mod-button-content-color-disabled,var(--spectrum-button-content-color-disabled)))}#label,::slotted([slot=icon]){visibility:visible;opacity:1;transition:opacity var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))ease-in-out}.spectrum-ProgressCircle{visibility:hidden;opacity:0;transition:opacity var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))ease-in-out,visibility 0s linear var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))}:host([pending]),:host([pending]){cursor:default}:host([pending]) .spectrum-ProgressCircle,:host([pending]) .spectrum-ProgressCircle{visibility:visible;opacity:1;transition:opacity var(--mod-button-animation-duration,var(--spectrum-button-animation-duration,.13s))ease-in-out}:host([static=black]),:host([static=white]){--spectrum-button-focus-indicator-color:var(--mod-static-black-focus-indicator-color,var(--spectrum-static-black-focus-indicator-color))}@media (forced-colors:active){:host{--highcontrast-button-content-color-disabled:GrayText;--highcontrast-button-border-color-disabled:GrayText;--mod-progress-circle-track-border-color:ButtonText;--mod-progress-circle-track-border-color-over-background:ButtonText;--mod-progress-circle-thickness:var(--spectrum-progress-circle-thickness-medium)}:host(:focus-visible):after{forced-color-adjust:none;box-shadow:0 0 0 var(--mod-button-focus-ring-thickness,var(--spectrum-button-focus-ring-thickness))ButtonText}:host([variant=accent][treatment=fill]){--highcontrast-button-background-color-default:ButtonText;--highcontrast-button-content-color-default:ButtonFace;--highcontrast-button-background-color-disabled:ButtonFace;--highcontrast-button-background-color-hover:Highlight;--highcontrast-button-background-color-down:Highlight;--highcontrast-button-background-color-focus:Highlight;--highcontrast-button-content-color-hover:ButtonFace;--highcontrast-button-content-color-down:ButtonFace;--highcontrast-button-content-color-focus:ButtonFace}:host([variant=accent][treatment=fill]) #label{forced-color-adjust:none}}:host{--spectrum-button-background-color-default:var(--system-spectrum-button-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-content-color-disabled)}:host([variant=accent]){--spectrum-button-background-color-default:var(--system-spectrum-button-accent-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-accent-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-accent-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-accent-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-accent-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-accent-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-accent-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-accent-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-accent-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-accent-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-accent-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-accent-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-accent-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-accent-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-accent-content-color-disabled)}:host([variant=accent][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-accent-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-accent-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-accent-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-accent-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-accent-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-accent-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-accent-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-accent-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-accent-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-accent-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-accent-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-accent-outline-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-accent-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-accent-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-accent-outline-content-color-disabled)}:host([variant=negative]){--spectrum-button-background-color-default:var(--system-spectrum-button-negative-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-negative-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-negative-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-negative-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-negative-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-negative-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-negative-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-negative-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-negative-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-negative-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-negative-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-negative-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-negative-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-negative-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-negative-content-color-disabled)}:host([variant=negative][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-negative-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-negative-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-negative-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-negative-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-negative-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-negative-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-negative-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-negative-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-negative-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-negative-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-negative-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-negative-outline-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-negative-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-negative-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-negative-outline-content-color-disabled)}:host([variant=primary]){--spectrum-button-background-color-default:var(--system-spectrum-button-primary-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-primary-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-primary-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-primary-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-primary-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-primary-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-primary-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-primary-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-primary-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-primary-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-primary-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-primary-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-primary-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-primary-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-primary-content-color-disabled)}:host([variant=primary][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-primary-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-primary-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-primary-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-primary-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-primary-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-primary-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-primary-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-primary-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-primary-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-primary-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-primary-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-primary-outline-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-primary-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-primary-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-primary-outline-content-color-disabled)}:host([variant=secondary]){--spectrum-button-background-color-default:var(--system-spectrum-button-secondary-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-secondary-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-secondary-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-secondary-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-secondary-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-secondary-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-secondary-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-secondary-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-secondary-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-secondary-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-secondary-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-secondary-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-secondary-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-secondary-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-secondary-content-color-disabled)}:host([variant=secondary][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-secondary-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-secondary-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-secondary-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-secondary-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-secondary-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-secondary-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-secondary-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-secondary-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-secondary-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-secondary-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-secondary-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-secondary-outline-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-secondary-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-secondary-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-secondary-outline-content-color-disabled)}:host([quiet]){--spectrum-button-background-color-default:var(--system-spectrum-button-quiet-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-quiet-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-quiet-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-quiet-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-quiet-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-quiet-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-quiet-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-quiet-border-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-quiet-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-quiet-border-color-disabled)}:host([selected]){--spectrum-button-background-color-default:var(--system-spectrum-button-selected-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-selected-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-selected-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-selected-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-selected-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-selected-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-selected-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-selected-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-selected-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-selected-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-selected-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-selected-content-color-focus);--spectrum-button-background-color-disabled:var(--system-spectrum-button-selected-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-selected-border-color-disabled)}:host([selected][emphasized]){--spectrum-button-background-color-default:var(--system-spectrum-button-selected-emphasized-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-selected-emphasized-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-selected-emphasized-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-selected-emphasized-background-color-focus)}:host([static=black][quiet]){--spectrum-button-border-color-default:var(--system-spectrum-button-staticblack-quiet-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticblack-quiet-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticblack-quiet-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticblack-quiet-border-color-focus);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticblack-quiet-border-color-disabled)}:host([static=white][quiet]){--spectrum-button-border-color-default:var(--system-spectrum-button-staticwhite-quiet-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticwhite-quiet-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticwhite-quiet-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticwhite-quiet-border-color-focus);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-quiet-border-color-disabled)}:host([static=white]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticwhite-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticwhite-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticwhite-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticwhite-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticwhite-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticwhite-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticwhite-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticwhite-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticwhite-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticwhite-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticwhite-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticwhite-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticwhite-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticwhite-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticwhite-content-color-disabled)}:host([static=white][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticwhite-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticwhite-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticwhite-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticwhite-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticwhite-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticwhite-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticwhite-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticwhite-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticwhite-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticwhite-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticwhite-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticwhite-outline-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticwhite-outline-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticwhite-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticwhite-outline-content-color-disabled)}:host([static=white][selected]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticwhite-selected-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticwhite-selected-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticwhite-selected-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticwhite-selected-background-color-focus);--spectrum-button-content-color-default:var(--mod-button-static-content-color,var(--system-spectrum-button-staticwhite-selected-content-color-default));--spectrum-button-content-color-hover:var(--mod-button-static-content-color,var(--system-spectrum-button-staticwhite-selected-content-color-hover));--spectrum-button-content-color-down:var(--mod-button-static-content-color,var(--system-spectrum-button-staticwhite-selected-content-color-down));--spectrum-button-content-color-focus:var(--mod-button-static-content-color,var(--system-spectrum-button-staticwhite-selected-content-color-focus));--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticwhite-selected-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-selected-border-color-disabled)}:host([static=white][variant=secondary]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticwhite-secondary-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticwhite-secondary-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticwhite-secondary-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticwhite-secondary-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticwhite-secondary-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticwhite-secondary-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticwhite-secondary-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticwhite-secondary-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticwhite-secondary-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticwhite-secondary-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticwhite-secondary-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticwhite-secondary-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticwhite-secondary-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticwhite-secondary-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-secondary-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticwhite-secondary-content-color-disabled)}:host([static=white][variant=secondary][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticwhite-secondary-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticwhite-secondary-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticwhite-secondary-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticwhite-secondary-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticwhite-secondary-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticwhite-secondary-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticwhite-secondary-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticwhite-secondary-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticwhite-secondary-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticwhite-secondary-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticwhite-secondary-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticwhite-secondary-outline-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticwhite-secondary-outline-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticwhite-secondary-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticwhite-secondary-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticwhite-secondary-outline-content-color-disabled)}:host([static=black]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticblack-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticblack-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticblack-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticblack-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticblack-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticblack-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticblack-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticblack-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticblack-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticblack-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticblack-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticblack-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticblack-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticblack-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticblack-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticblack-content-color-disabled)}:host([static=black][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticblack-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticblack-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticblack-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticblack-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticblack-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticblack-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticblack-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticblack-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticblack-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticblack-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticblack-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticblack-outline-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticblack-outline-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticblack-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticblack-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticblack-outline-content-color-disabled)}:host([static=black][variant=secondary]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticblack-secondary-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticblack-secondary-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticblack-secondary-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticblack-secondary-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticblack-secondary-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticblack-secondary-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticblack-secondary-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticblack-secondary-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticblack-secondary-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticblack-secondary-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticblack-secondary-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticblack-secondary-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticblack-secondary-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticblack-secondary-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticblack-secondary-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticblack-secondary-content-color-disabled)}:host([static=black][variant=secondary][treatment=outline]){--spectrum-button-background-color-default:var(--system-spectrum-button-staticblack-secondary-outline-background-color-default);--spectrum-button-background-color-hover:var(--system-spectrum-button-staticblack-secondary-outline-background-color-hover);--spectrum-button-background-color-down:var(--system-spectrum-button-staticblack-secondary-outline-background-color-down);--spectrum-button-background-color-focus:var(--system-spectrum-button-staticblack-secondary-outline-background-color-focus);--spectrum-button-border-color-default:var(--system-spectrum-button-staticblack-secondary-outline-border-color-default);--spectrum-button-border-color-hover:var(--system-spectrum-button-staticblack-secondary-outline-border-color-hover);--spectrum-button-border-color-down:var(--system-spectrum-button-staticblack-secondary-outline-border-color-down);--spectrum-button-border-color-focus:var(--system-spectrum-button-staticblack-secondary-outline-border-color-focus);--spectrum-button-content-color-default:var(--system-spectrum-button-staticblack-secondary-outline-content-color-default);--spectrum-button-content-color-hover:var(--system-spectrum-button-staticblack-secondary-outline-content-color-hover);--spectrum-button-content-color-down:var(--system-spectrum-button-staticblack-secondary-outline-content-color-down);--spectrum-button-content-color-focus:var(--system-spectrum-button-staticblack-secondary-outline-content-color-focus);--spectrum-button-focus-indicator-color:var(--system-spectrum-button-staticblack-secondary-outline-focus-indicator-color);--spectrum-button-background-color-disabled:var(--system-spectrum-button-staticblack-secondary-outline-background-color-disabled);--spectrum-button-border-color-disabled:var(--system-spectrum-button-staticblack-secondary-outline-border-color-disabled);--spectrum-button-content-color-disabled:var(--system-spectrum-button-staticblack-secondary-outline-content-color-disabled)}@media (forced-colors:active){:host([treatment][disabled]){border-color:graytext}:host([treatment]:not([disabled]):hover){border-color:highlight}}@keyframes show-progress-circle{0%{visibility:hidden}to{visibility:visible}}@keyframes hide-icons-label{0%{visibility:visible}to{visibility:hidden}}@keyframes update-pending-button-styles{to{background-color:var(--highcontrast-button-background-color-disabled,var(--mod-button-background-color-disabled,var(--spectrum-button-background-color-disabled)));border-color:var(--highcontrast-button-border-color-disabled,var(--mod-button-border-color-disabled,var(--spectrum-button-border-color-disabled)));color:var(--highcontrast-button-content-color-disabled,var(--mod-button-content-color-disabled,var(--spectrum-button-content-color-disabled)))}}:host([pending]:not([disabled])){cursor:default;pointer-events:none;animation:update-pending-button-styles 0s var(--pending-delay,1s)forwards}::slotted([slot=icon]){visibility:revert-layer;--mod-progress-circle-position:relative}sp-progress-circle{visibility:hidden;display:block;position:absolute;left:50%;transform:translate(-50%)}:host([pending]:not([disabled])) sp-progress-circle{animation:show-progress-circle 0s var(--pending-delay,1s)forwards}:host([pending]:not([disabled])) slot[name=icon],:host([pending]:not([disabled])) #label{animation:hide-icons-label 0s var(--pending-delay,1s)forwards}
`;
var button_css_default = o14;

// ../node_modules/@spectrum-web-components/button/src/Button.js
init_directives();
var u9 = Object.defineProperty;
var h7 = Object.getOwnPropertyDescriptor;
var i12 = (n18, r16, t16, s14) => {
  for (var e22 = s14 > 1 ? void 0 : s14 ? h7(r16, t16) : r16, l14 = n18.length - 1, o26; l14 >= 0; l14--) (o26 = n18[l14]) && (e22 = (s14 ? o26(r16, t16, e22) : o26(e22)) || e22);
  return s14 && e22 && u9(r16, t16, e22), e22;
};
var VALID_VARIANTS = ["accent", "primary", "secondary", "negative", "white", "black"];
var Button = class extends SizedMixin(ButtonBase, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.pendingLabel = "Pending";
    this.pending = false;
    this.cachedAriaLabel = null;
    this._variant = "accent";
    this.treatment = "fill";
  }
  static get styles() {
    return [...super.styles, button_css_default];
  }
  click() {
    this.pending || super.click();
  }
  get variant() {
    return this._variant;
  }
  set variant(t16) {
    if (t16 !== this.variant) {
      switch (this.requestUpdate("variant", this.variant), t16) {
        case "cta":
          this._variant = "accent";
          break;
        case "overBackground":
          this.removeAttribute("variant"), this.static = "white", this.treatment = "outline";
          return;
        case "white":
        case "black":
          this.static = t16, this.removeAttribute("variant");
          return;
        case null:
          return;
        default:
          VALID_VARIANTS.includes(t16) ? this._variant = t16 : this._variant = "accent";
          break;
      }
      this.setAttribute("variant", this.variant);
    }
  }
  set quiet(t16) {
    this.treatment = t16 ? "outline" : "fill";
  }
  get quiet() {
    return this.treatment === "outline";
  }
  firstUpdated(t16) {
    super.firstUpdated(t16), this.hasAttribute("variant") || this.setAttribute("variant", this.variant);
  }
  updated(t16) {
    super.updated(t16), t16.has("pending") && (this.pending && this.pendingLabel !== this.getAttribute("aria-label") ? this.disabled || (this.cachedAriaLabel = this.getAttribute("aria-label") || "", this.setAttribute("aria-label", this.pendingLabel)) : !this.pending && this.cachedAriaLabel ? this.setAttribute("aria-label", this.cachedAriaLabel) : !this.pending && this.cachedAriaLabel === "" && this.removeAttribute("aria-label")), t16.has("disabled") && (!this.disabled && this.pendingLabel !== this.getAttribute("aria-label") ? this.pending && (this.cachedAriaLabel = this.getAttribute("aria-label") || "", this.setAttribute("aria-label", this.pendingLabel)) : this.disabled && this.cachedAriaLabel ? this.setAttribute("aria-label", this.cachedAriaLabel) : this.disabled && this.cachedAriaLabel == "" && this.removeAttribute("aria-label"));
  }
  renderButton() {
    return x`
            ${this.buttonContent}
            ${n12(this.pending, () => (Promise.resolve().then(() => init_sp_progress_circle()), x`
                    <sp-progress-circle
                        indeterminate
                        static="white"
                        aria-hidden="true"
                    ></sp-progress-circle>
                `))}
        `;
  }
};
i12([n7({ type: String, attribute: "pending-label" })], Button.prototype, "pendingLabel", 2), i12([n7({ type: Boolean, reflect: true, attribute: true })], Button.prototype, "pending", 2), i12([n7()], Button.prototype, "variant", 1), i12([n7({ type: String, reflect: true })], Button.prototype, "static", 2), i12([n7({ reflect: true })], Button.prototype, "treatment", 2), i12([n7({ type: Boolean })], Button.prototype, "quiet", 1);

// ../node_modules/@spectrum-web-components/button/src/ClearButton.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/button/src/StyledButton.js
var StyledButton = class extends ButtonBase {
};

// ../node_modules/@spectrum-web-components/clear-button/src/clear-button.css.js
init_src();
var r8 = i3`
    :host{--spectrum-clear-button-height:var(--spectrum-component-height-100);--spectrum-clear-button-width:var(--spectrum-component-height-100);--spectrum-clear-button-padding:var(--spectrum-in-field-button-edge-to-fill);--spectrum-clear-button-icon-color:var(--spectrum-neutral-content-color-default);--spectrum-clear-button-icon-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-clear-button-icon-color-down:var(--spectrum-neutral-content-color-down);--spectrum-clear-button-icon-color-key-focus:var(--spectrum-neutral-content-color-key-focus)}:host([size=s]){--spectrum-clear-button-height:var(--spectrum-component-height-75);--spectrum-clear-button-width:var(--spectrum-component-height-75)}:host([size=l]){--spectrum-clear-button-height:var(--spectrum-component-height-200);--spectrum-clear-button-width:var(--spectrum-component-height-200)}:host([size=xl]){--spectrum-clear-button-height:var(--spectrum-component-height-300);--spectrum-clear-button-width:var(--spectrum-component-height-300)}:host .spectrum-ClearButton--quiet{--mod-clear-button-background-color:var(--spectrum-clear-button-background-color-quiet,transparent);--mod-clear-button-background-color-hover:var(--spectrum-clear-button-background-color-hover-quiet,transparent);--mod-clear-button-background-color-down:var(--spectrum-clear-button-background-color-down-quiet,transparent);--mod-clear-button-background-color-key-focus:var(--spectrum-clear-button-background-color-key-focus-quiet,transparent)}:host([variant=overBackground]){--mod-clear-button-icon-color:var(--spectrum-clear-button-icon-color-over-background,var(--spectrum-white));--mod-clear-button-icon-color-hover:var(--spectrum-clear-button-icon-color-hover-over-background,var(--spectrum-white));--mod-clear-button-icon-color-down:var(--spectrum-clear-button-icon-color-down-over-background,var(--spectrum-white));--mod-clear-button-icon-color-key-focus:var(--spectrum-clear-button-icon-color-key-focus-over-background,var(--spectrum-white));--mod-clear-button-background-color:var(--spectrum-clear-button-background-color-over-background,transparent);--mod-clear-button-background-color-hover:var(--spectrum-clear-button-background-color-hover-over-background,var(--spectrum-transparent-white-300));--mod-clear-button-background-color-down:var(--spectrum-clear-button-background-color-hover-over-background,var(--spectrum-transparent-white-400));--mod-clear-button-background-color-key-focus:var(--spectrum-clear-button-background-color-hover-over-background,var(--spectrum-transparent-white-300))}:host([disabled]),:host([disabled]){--mod-clear-button-icon-color:var(--mod-clear-button-icon-color-disabled,var(--spectrum-disabled-content-color));--mod-clear-button-icon-color-hover:var(--spectrum-clear-button-icon-color-hover-disabled,var(--spectrum-disabled-content-color));--mod-clear-button-icon-color-down:var(--spectrum-clear-button-icon-color-down-disabled,var(--spectrum-disabled-content-color));--mod-clear-button-background-color:var(--mod-clear-button-background-color-disabled,transparent)}:host{block-size:var(--mod-clear-button-height,var(--spectrum-clear-button-height));inline-size:var(--mod-clear-button-width,var(--spectrum-clear-button-width));cursor:pointer;background-color:var(--mod-clear-button-background-color,transparent);padding:var(--mod-clear-button-padding,var(--spectrum-clear-button-padding));color:var(--mod-clear-button-icon-color,var(--spectrum-clear-button-icon-color));border:none;border-radius:100%;margin:0}.icon{margin-block:0;margin-inline:auto}@media (hover:hover){:host(:hover){color:var(--highcontrast-clear-button-icon-color-hover,var(--mod-clear-button-icon-color-hover,var(--spectrum-clear-button-icon-color-hover)))}:host(:hover) .fill{background-color:var(--mod-clear-button-background-color-hover,var(--spectrum-clear-button-background-color-hover))}}:host(:is(:active,[active])){color:var(--mod-clear-button-icon-color-down,var(--spectrum-clear-button-icon-color-down))}:host(:is(:active,[active])) .fill{background-color:var(--mod-clear-button-background-color-down,var(--spectrum-clear-button-background-color-down))}:host([focus-within]) .js-focus-within,:host(:focus-visible),:host:focus-within,:host([focus-within]) .js-focus-within{color:var(--mod-clear-button-icon-color-key-focus,var(--spectrum-clear-button-icon-color-key-focus))}:host([focus-within]) .js-focus-within .fill,:host(:focus-visible) .fill,:host:focus-within .fill,:host([focus-within]) .js-focus-within .fill{background-color:var(--mod-clear-button-background-color-key-focus,var(--spectrum-clear-button-background-color-key-focus))}.fill{background-color:var(--mod-clear-button-background-color,var(--spectrum-clear-button-background-color));border-radius:100%;justify-content:center;align-items:center;block-size:100%;inline-size:100%;display:flex}:host([variant=overBackground]:focus-visible){outline:none}@media (forced-colors:active){:host:not(:disabled){--highcontrast-clear-button-icon-color-hover:Highlight}}:host{--spectrum-clear-button-background-color:var(--system-spectrum-clearbutton-spectrum-clear-button-background-color);--spectrum-clear-button-background-color-hover:var(--system-spectrum-clearbutton-spectrum-clear-button-background-color-hover);--spectrum-clear-button-background-color-down:var(--system-spectrum-clearbutton-spectrum-clear-button-background-color-down);--spectrum-clear-button-background-color-key-focus:var(--system-spectrum-clearbutton-spectrum-clear-button-background-color-key-focus)}
`;
var clear_button_css_default = r8;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross75.js
init_src();

// ../node_modules/@spectrum-web-components/icon/src/IconBase.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/icon/src/icon.css.js
init_src();
var s11 = i3`
    :host{--spectrum-icon-inline-size:var(--mod-icon-inline-size,var(--mod-icon-size,var(--spectrum-icon-size)));--spectrum-icon-block-size:var(--mod-icon-block-size,var(--mod-icon-size,var(--spectrum-icon-size)));inline-size:var(--spectrum-icon-inline-size);block-size:var(--spectrum-icon-block-size);color:var(--mod-icon-color,inherit);fill:currentColor;pointer-events:none;display:inline-block}:host(:not(:root)){overflow:hidden}@media (forced-colors:active){:host{forced-color-adjust:auto}}:host{--spectrum-icon-size:var(--spectrum-workflow-icon-size-100)}:host([size=xxs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-xxs)}:host([size=xs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=l]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-xxl)}:host{--spectrum-icon-size:inherit;--spectrum-icon-inline-size:var(--mod-icon-inline-size,var(--mod-icon-size,var(--_spectrum-icon-size)));--spectrum-icon-block-size:var(--mod-icon-block-size,var(--mod-icon-size,var(--_spectrum-icon-size)));--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-100))}#container{height:100%}img,svg,::slotted(*){vertical-align:top;color:inherit;width:100%;height:100%}@media (forced-colors:active){img,svg,::slotted(*){forced-color-adjust:auto}}:host([size=xxs]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-xxs))}:host([size=xs]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-50))}:host([size=s]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-75))}:host([size=l]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-200))}:host([size=xl]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-300))}:host([size=xxl]){--_spectrum-icon-size:var(--spectrum-icon-size,var(--spectrum-workflow-icon-size-xxl))}
`;
var icon_css_default = s11;

// ../node_modules/@spectrum-web-components/icon/src/IconBase.js
var a6 = Object.defineProperty;
var d6 = Object.getOwnPropertyDescriptor;
var p6 = (i20, r16, t16, l14) => {
  for (var e22 = l14 > 1 ? void 0 : l14 ? d6(r16, t16) : r16, s14 = i20.length - 1, o26; s14 >= 0; s14--) (o26 = i20[s14]) && (e22 = (l14 ? o26(r16, t16, e22) : o26(e22)) || e22);
  return l14 && e22 && a6(r16, t16, e22), e22;
};
var IconBase = class extends SpectrumElement {
  constructor() {
    super(...arguments);
    this.label = "";
  }
  static get styles() {
    return [icon_css_default];
  }
  update(t16) {
    t16.has("label") && (this.label ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true")), super.update(t16);
  }
  render() {
    return x`
            <slot></slot>
        `;
  }
};
p6([n7()], IconBase.prototype, "label", 2), p6([n7({ reflect: true })], IconBase.prototype, "size", 2);

// ../node_modules/@spectrum-web-components/icons-ui/src/custom-tag.js
var t7;
var tag = function(e22, ...a10) {
  return t7 ? t7(e22, ...a10) : a10.reduce((r16, p18, l14) => r16 + p18 + e22[l14 + 1], e22[0]);
};
var setCustomTemplateLiteralTag = (e22) => {
  t7 = e22;
};

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross75.js
var Cross75Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross75" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m5.188 4 2.14-2.14A.84.84 0 1 0 6.141.672L4 2.812 1.86.672A.84.84 0 0 0 .672 1.86L2.812 4 .672 6.14A.84.84 0 1 0 1.86 7.328L4 5.188l2.14 2.14A.84.84 0 1 0 7.328 6.14z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross75.js
var IconCross75 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross75Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross75.js
init_define_element();
defineElement("sp-icon-cross75", IconCross75);

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross100.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross100.js
var Cross100Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross100" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 8 8"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m5.238 4 2.456-2.457A.875.875 0 1 0 6.456.306L4 2.763 1.543.306A.875.875 0 0 0 .306 1.544L2.763 4 .306 6.457a.875.875 0 1 0 1.238 1.237L4 5.237l2.456 2.457a.875.875 0 1 0 1.238-1.237z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross100.js
var IconCross100 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross100Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross100.js
init_define_element();
defineElement("sp-icon-cross100", IconCross100);

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross200.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross200.js
var Cross200Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross200" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m6.29 5 2.922-2.922a.911.911 0 0 0-1.29-1.29L5 3.712 2.078.789a.911.911 0 0 0-1.29 1.289L3.712 5 .79 7.922a.911.911 0 1 0 1.289 1.29L5 6.288 7.923 9.21a.911.911 0 0 0 1.289-1.289z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross200.js
var IconCross200 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross200Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross200.js
init_define_element();
defineElement("sp-icon-cross200", IconCross200);

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross300.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross300.js
var Cross300Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross300" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m7.344 6 3.395-3.396a.95.95 0 0 0-1.344-1.342L6 4.657 2.604 1.262a.95.95 0 0 0-1.342 1.342L4.657 6 1.262 9.396a.95.95 0 0 0 1.343 1.343L6 7.344l3.395 3.395a.95.95 0 0 0 1.344-1.344z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross300.js
var IconCross300 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross300Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross300.js
init_define_element();
defineElement("sp-icon-cross300", IconCross300);

// ../node_modules/@spectrum-web-components/icon/src/spectrum-icon-cross.css.js
init_src();
var c11 = i3`
    .spectrum-UIIcon-Cross75{--spectrum-icon-size:var(--spectrum-cross-icon-size-75)}.spectrum-UIIcon-Cross100{--spectrum-icon-size:var(--spectrum-cross-icon-size-100)}.spectrum-UIIcon-Cross200{--spectrum-icon-size:var(--spectrum-cross-icon-size-200)}.spectrum-UIIcon-Cross300{--spectrum-icon-size:var(--spectrum-cross-icon-size-300)}.spectrum-UIIcon-Cross400{--spectrum-icon-size:var(--spectrum-cross-icon-size-400)}.spectrum-UIIcon-Cross500{--spectrum-icon-size:var(--spectrum-cross-icon-size-500)}.spectrum-UIIcon-Cross600{--spectrum-icon-size:var(--spectrum-cross-icon-size-600)}
`;
var spectrum_icon_cross_css_default = c11;

// ../node_modules/@spectrum-web-components/button/src/ClearButton.js
var p7 = Object.defineProperty;
var m5 = Object.getOwnPropertyDescriptor;
var l10 = (e22, o26, c19, t16) => {
  for (var s14 = t16 > 1 ? void 0 : t16 ? m5(o26, c19) : o26, i20 = e22.length - 1, n18; i20 >= 0; i20--) (n18 = e22[i20]) && (s14 = (t16 ? n18(o26, c19, s14) : n18(s14)) || s14);
  return t16 && s14 && p7(o26, c19, s14), s14;
};
var f4 = { s: () => x`
        <sp-icon-cross75
            slot="icon"
            class="icon spectrum-UIIcon-Cross75"
        ></sp-icon-cross75>
    `, m: () => x`
        <sp-icon-cross100
            slot="icon"
            class="icon spectrum-UIIcon-Cross100"
        ></sp-icon-cross100>
    `, l: () => x`
        <sp-icon-cross200
            slot="icon"
            class="icon spectrum-UIIcon-Cross200"
        ></sp-icon-cross200>
    `, xl: () => x`
        <sp-icon-cross300
            slot="icon"
            class="icon spectrum-UIIcon-Cross300"
        ></sp-icon-cross300>
    ` };
var ClearButton = class extends SizedMixin(StyledButton, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.variant = "";
  }
  static get styles() {
    return [...super.styles, clear_button_css_default, spectrum_icon_cross_css_default];
  }
  get buttonContent() {
    return [f4[this.size]()];
  }
  render() {
    return x`
            <div class="fill">${super.render()}</div>
        `;
  }
};
l10([n7({ reflect: true })], ClearButton.prototype, "variant", 2);

// ../node_modules/@spectrum-web-components/button/src/CloseButton.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/close-button/src/close-button.css.js
init_src();
var t8 = i3`
    :host{cursor:pointer;-webkit-user-select:none;user-select:none;box-sizing:border-box;font-family:var(--mod-button-font-family,var(--mod-sans-font-family-stack,var(--spectrum-sans-font-family-stack)));line-height:var(--mod-button-line-height,var(--mod-line-height-100,var(--spectrum-line-height-100)));text-transform:none;vertical-align:top;-webkit-appearance:button;transition:background var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,border-color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,box-shadow var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;border-style:solid;margin:0;-webkit-text-decoration:none;text-decoration:none;overflow:visible}:host(:focus){outline:none}:host([disabled]),:host([disabled]){cursor:default}:host a{-webkit-user-select:none;user-select:none;-webkit-appearance:none}:host{--spectrum-closebutton-size-300:24px;--spectrum-closebutton-size-400:32px;--spectrum-closebutton-size-500:40px;--spectrum-closebutton-size-600:48px;--spectrum-closebutton-icon-color-default:var(--spectrum-neutral-content-color-default);--spectrum-closebutton-icon-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-closebutton-icon-color-down:var(--spectrum-neutral-content-color-down);--spectrum-closebutton-icon-color-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-closebutton-icon-color-disabled:var(--spectrum-disabled-content-color);--spectrum-closebutton-focus-indicator-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-closebutton-focus-indicator-gap:var(--spectrum-focus-indicator-gap);--spectrum-closebutton-focus-indicator-color:var(--spectrum-focus-indicator-color);--spectrum-closebutton-height:var(--spectrum-component-height-100);--spectrum-closebutton-width:var(--spectrum-closebutton-height);--spectrum-closebutton-size:var(--spectrum-closebutton-size-400);--spectrum-closebutton-border-radius:var(--spectrum-closebutton-size-400);--spectrum-closebutton-animation-duration:var(--spectrum-animation-duration-100)}:host([size=s]){--spectrum-closebutton-height:var(--spectrum-component-height-75);--spectrum-closebutton-width:var(--spectrum-closebutton-height);--spectrum-closebutton-size:var(--spectrum-closebutton-size-300);--spectrum-closebutton-border-radius:var(--spectrum-closebutton-size-300)}:host{--spectrum-closebutton-height:var(--spectrum-component-height-100);--spectrum-closebutton-width:var(--spectrum-closebutton-height);--spectrum-closebutton-size:var(--spectrum-closebutton-size-400);--spectrum-closebutton-border-radius:var(--spectrum-closebutton-size-400)}:host([size=l]){--spectrum-closebutton-height:var(--spectrum-component-height-200);--spectrum-closebutton-width:var(--spectrum-closebutton-height);--spectrum-closebutton-size:var(--spectrum-closebutton-size-500);--spectrum-closebutton-border-radius:var(--spectrum-closebutton-size-500)}:host([size=xl]){--spectrum-closebutton-height:var(--spectrum-component-height-300);--spectrum-closebutton-width:var(--spectrum-closebutton-height);--spectrum-closebutton-size:var(--spectrum-closebutton-size-600);--spectrum-closebutton-border-radius:var(--spectrum-closebutton-size-600)}:host([static=white]){--spectrum-closebutton-static-background-color-default:transparent;--spectrum-closebutton-static-background-color-hover:var(--spectrum-transparent-white-300);--spectrum-closebutton-static-background-color-down:var(--spectrum-transparent-white-400);--spectrum-closebutton-static-background-color-focus:var(--spectrum-transparent-white-300);--spectrum-closebutton-icon-color-default:var(--spectrum-white);--spectrum-closebutton-icon-color-disabled:var(--spectrum-disabled-static-white-content-color);--spectrum-closebutton-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color)}:host([static=black]){--spectrum-closebutton-static-background-color-default:transparent;--spectrum-closebutton-static-background-color-hover:var(--spectrum-transparent-black-300);--spectrum-closebutton-static-background-color-down:var(--spectrum-transparent-black-400);--spectrum-closebutton-static-background-color-focus:var(--spectrum-transparent-black-300);--spectrum-closebutton-icon-color-default:var(--spectrum-black);--spectrum-closebutton-icon-color-disabled:var(--spectrum-disabled-static-black-content-color);--spectrum-closebutton-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color)}@media (forced-colors:active){:host{--highcontrast-closebutton-icon-color-disabled:GrayText;--highcontrast-closebutton-icon-color-down:Highlight;--highcontrast-closebutton-icon-color-hover:Highlight;--highcontrast-closebutton-icon-color-focus:Highlight;--highcontrast-closebutton-background-color-default:ButtonFace;--highcontrast-closebutton-focus-indicator-color:ButtonText}:host(:focus-visible):after{forced-color-adjust:none;margin:var(--mod-closebutton-focus-indicator-gap,var(--spectrum-closebutton-focus-indicator-gap));transition:opacity var(--mod-closebutton-animation-duration,var(--spectrum-closebutton-animation-duration))ease-out,margin var(--mod-closebutton-animation-duraction,var(--spectrum-closebutton-animation-duration))ease-out}:host([static=black]){--highcontrast-closebutton-static-background-color-default:ButtonFace;--highcontrast-closebutton-icon-color-default:Highlight;--highcontrast-closebutton-icon-color-disabled:GrayText}:host([static=white]){--highcontrast-closebutton-static-background-color-default:ButtonFace;--highcontrast-closebutton-icon-color-default:Highlight;--highcontrast-closebutton-icon-color-disabled:Highlight}}:host{block-size:var(--mod-closebutton-height,var(--spectrum-closebutton-height));inline-size:var(--mod-closebutton-width,var(--spectrum-closebutton-width));color:inherit;border-radius:var(--mod-closebutton-border-radius,var(--spectrum-closebutton-border-radius));transition:border-color var(--mod-closebutton-animation-duration,var(--spectrum-closebutton-animation-duration))ease-in-out;margin-inline:var(--mod-closebutton-margin-inline);justify-content:center;align-items:center;align-self:var(--mod-closebutton-align-self);border-width:0;border-color:#0000;flex-direction:row;margin-block-start:var(--mod-closebutton-margin-top);padding:0;display:inline-flex;position:relative}:host:after{pointer-events:none;content:"";margin:calc(var(--mod-closebutton-focus-indicator-gap,var(--spectrum-closebutton-focus-indicator-gap))*-1);border-radius:calc(var(--mod-closebutton-size,var(--spectrum-closebutton-size)) + var(--mod-closebutton-focus-indicator-gap,var(--spectrum-closebutton-focus-indicator-gap)));transition:box-shadow var(--mod-closebutton-animation-duration,var(--spectrum-closebutton-animation-duration))ease-in-out;position:absolute;inset-block:0;inset-inline:0}:host(:focus-visible){box-shadow:none;outline:none}:host(:focus-visible):after{box-shadow:0 0 0 var(--mod-closebutton-focus-indicator-thickness,var(--spectrum-closebutton-focus-indicator-thickness))var(--highcontrast-closebutton-focus-indicator-color,var(--mod-closebutton-focus-indicator-color,var(--spectrum-closebutton-focus-indicator-color)))}:host(:not([disabled])){background-color:var(--highcontrast-closebutton-background-color-default,var(--mod-closebutton-background-color-default,var(--spectrum-closebutton-background-color-default)))}:host(:not([disabled]):is(:active,[active])){background-color:var(--mod-closebutton-background-color-down,var(--spectrum-closebutton-background-color-down))}:host(:not([disabled]):is(:active,[active])) .icon{color:var(--highcontrast-closebutton-icon-color-down,var(--mod-closebutton-icon-color-down,var(--spectrum-closebutton-icon-color-down)))}:host([focused]:not([disabled])),:host(:not([disabled]):focus-visible){background-color:var(--mod-closebutton-background-color-focus,var(--spectrum-closebutton-background-color-focus))}:host([focused]:not([disabled])) .icon,:host(:not([disabled]):focus-visible) .icon{color:var(--highcontrast-closebutton-icon-color-focus,var(--mod-closebutton-icon-color-focus,var(--spectrum-closebutton-icon-color-focus)))}:host(:not([disabled])) .icon{color:var(--mod-closebutton-icon-color-default,var(--spectrum-closebutton-icon-color-default))}:host([focused]:not([disabled])) .icon,:host(:not([disabled]):focus) .icon{color:var(--highcontrast-closebutton-icon-color-focus,var(--mod-closebutton-icon-color-focus,var(--spectrum-closebutton-icon-color-focus)))}:host([disabled]){background-color:var(--mod-closebutton-background-color-default,var(--spectrum-closebutton-background-color-default))}:host([disabled]) .icon{color:var(--highcontrast-closebutton-icon-color-disabled,var(--mod-closebutton-icon-color-disabled,var(--spectrum-closebutton-icon-color-disabled)))}:host([static=black]:not([disabled])),:host([static=white]:not([disabled])){background-color:var(--highcontrast-closebutton-static-background-color-default,var(--mod-closebutton-static-background-color-default,var(--spectrum-closebutton-static-background-color-default)))}@media (hover:hover){:host(:not([disabled]):hover){background-color:var(--mod-closebutton-background-color-hover,var(--spectrum-closebutton-background-color-hover))}:host(:not([disabled]):hover) .icon{color:var(--highcontrast-closebutton-icon-color-hover,var(--mod-closebutton-icon-color-hover,var(--spectrum-closebutton-icon-color-hover)))}:host([static=black]:not([disabled]):hover),:host([static=white]:not([disabled]):hover){background-color:var(--highcontrast-closebutton-static-background-color-hover,var(--mod-closebutton-static-background-color-hover,var(--spectrum-closebutton-static-background-color-hover)))}:host([static=black]:not([disabled]):hover) .icon,:host([static=white]:not([disabled]):hover) .icon{color:var(--highcontrast-closebutton-icon-color-default,var(--mod-closebutton-icon-color-default,var(--spectrum-closebutton-icon-color-default)))}}:host([static=black]:not([disabled]):is(:active,[active])),:host([static=white]:not([disabled]):is(:active,[active])){background-color:var(--highcontrast-closebutton-static-background-color-down,var(--mod-closebutton-static-background-color-down,var(--spectrum-closebutton-static-background-color-down)))}:host([static=black]:not([disabled]):is(:active,[active])) .icon,:host([static=white]:not([disabled]):is(:active,[active])) .icon{color:var(--highcontrast-closebutton-icon-color-default,var(--mod-closebutton-icon-color-default,var(--spectrum-closebutton-icon-color-default)))}:host([static=black][focused]:not([disabled])),:host([static=black]:not([disabled]):focus-visible),:host([static=white][focused]:not([disabled])),:host([static=white]:not([disabled]):focus-visible){background-color:var(--highcontrast-closebutton-static-background-color-focus,var(--mod-closebutton-static-background-color-focus,var(--spectrum-closebutton-static-background-color-focus)))}:host([static=black][focused]:not([disabled])) .icon,:host([static=black][focused]:not([disabled])) .icon,:host([static=black]:not([disabled]):focus) .icon,:host([static=black]:not([disabled]):focus-visible) .icon,:host([static=white][focused]:not([disabled])) .icon,:host([static=white][focused]:not([disabled])) .icon,:host([static=white]:not([disabled]):focus) .icon,:host([static=white]:not([disabled]):focus-visible) .icon{color:var(--highcontrast-closebutton-icon-color-default,var(--mod-closebutton-icon-color-default,var(--spectrum-closebutton-icon-color-default)))}:host([static=black]:not([disabled])) .icon,:host([static=white]:not([disabled])) .icon{color:var(--mod-closebutton-icon-color-default,var(--spectrum-closebutton-icon-color-default))}:host([static=black][disabled]) .icon,:host([static=white][disabled]) .icon{color:var(--highcontrast-closebutton-icon-disabled,var(--mod-closebutton-icon-color-disabled,var(--spectrum-closebutton-icon-color-disabled)))}.icon{margin:0}:host{--spectrum-closebutton-background-color-default:var(--system-spectrum-closebutton-background-color-default);--spectrum-closebutton-background-color-hover:var(--system-spectrum-closebutton-background-color-hover);--spectrum-closebutton-background-color-down:var(--system-spectrum-closebutton-background-color-down);--spectrum-closebutton-background-color-focus:var(--system-spectrum-closebutton-background-color-focus)}
`;
var close_button_css_default = t8;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross400.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross400.js
var Cross400Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross400" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m7.398 6 3.932-3.932A.989.989 0 0 0 9.932.67L6 4.602 2.068.67A.989.989 0 0 0 .67 2.068L4.602 6 .67 9.932a.989.989 0 1 0 1.398 1.398L6 7.398l3.932 3.932a.989.989 0 0 0 1.398-1.398z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross400.js
var IconCross400 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross400Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross400.js
init_define_element();
defineElement("sp-icon-cross400", IconCross400);

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross500.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Cross500.js
var Cross500Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Cross500" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 14"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="m8.457 7 4.54-4.54a1.03 1.03 0 0 0-1.458-1.456L7 5.543l-4.54-4.54a1.03 1.03 0 0 0-1.457 1.458L5.543 7l-4.54 4.54a1.03 1.03 0 1 0 1.457 1.456L7 8.457l4.54 4.54a1.03 1.03 0 0 0 1.456-1.458z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCross500.js
var IconCross500 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Cross500Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-cross500.js
init_define_element();
defineElement("sp-icon-cross500", IconCross500);

// ../node_modules/@spectrum-web-components/button/src/CloseButton.js
var m6 = Object.defineProperty;
var u10 = Object.getOwnPropertyDescriptor;
var p8 = (c19, t16, e22, o26) => {
  for (var s14 = o26 > 1 ? void 0 : o26 ? u10(t16, e22) : t16, i20 = c19.length - 1, n18; i20 >= 0; i20--) (n18 = c19[i20]) && (s14 = (o26 ? n18(t16, e22, s14) : n18(s14)) || s14);
  return o26 && s14 && m6(t16, e22, s14), s14;
};
var y2 = { s: () => x`
        <sp-icon-cross200
            slot="icon"
            class="icon spectrum-UIIcon-Cross200"
        ></sp-icon-cross200>
    `, m: () => x`
        <sp-icon-cross300
            slot="icon"
            class="icon spectrum-UIIcon-Cross300"
        ></sp-icon-cross300>
    `, l: () => x`
        <sp-icon-cross400
            slot="icon"
            class="icon spectrum-UIIcon-Cross400"
        ></sp-icon-cross400>
    `, xl: () => x`
        <sp-icon-cross500
            slot="icon"
            class="icon spectrum-UIIcon-Cross500"
        ></sp-icon-cross500>
    ` };
var CloseButton = class extends SizedMixin(StyledButton, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.variant = "";
  }
  static get styles() {
    return [...super.styles, close_button_css_default, spectrum_icon_cross_css_default];
  }
  get buttonContent() {
    return [y2[this.size]()];
  }
};
p8([n7({ reflect: true })], CloseButton.prototype, "variant", 2), p8([n7({ type: String, reflect: true })], CloseButton.prototype, "static", 2);

// ../node_modules/@spectrum-web-components/action-button/src/action-button.css.js
init_src();
var o15 = i3`
    :host{cursor:pointer;-webkit-user-select:none;user-select:none;box-sizing:border-box;font-family:var(--mod-button-font-family,var(--mod-sans-font-family-stack,var(--spectrum-sans-font-family-stack)));line-height:var(--mod-button-line-height,var(--mod-line-height-100,var(--spectrum-line-height-100)));text-transform:none;vertical-align:top;-webkit-appearance:button;transition:background var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,border-color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,box-shadow var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;border-style:solid;justify-content:center;align-items:center;margin:0;-webkit-text-decoration:none;text-decoration:none;display:inline-flex;overflow:visible}:host(:focus){outline:none}:host([disabled]),:host([disabled]){cursor:default}::slotted([slot=icon]){flex-shrink:0;max-block-size:100%}#label{text-align:center;place-self:center}#label:empty{display:none}:host{--spectrum-actionbutton-animation-duration:var(--spectrum-animation-duration-100);--spectrum-actionbutton-border-radius:var(--spectrum-corner-radius-100);--spectrum-actionbutton-border-width:var(--spectrum-border-width-100);--spectrum-actionbutton-content-color-default:var(--spectrum-neutral-content-color-default);--spectrum-actionbutton-content-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-actionbutton-content-color-down:var(--spectrum-neutral-content-color-down);--spectrum-actionbutton-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-actionbutton-focus-indicator-gap:var(--spectrum-focus-indicator-gap);--spectrum-actionbutton-focus-indicator-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-actionbutton-focus-indicator-color:var(--spectrum-focus-indicator-color);--spectrum-actionbutton-focus-indicator-border-radius:calc(var(--spectrum-actionbutton-border-radius) + var(--spectrum-actionbutton-focus-indicator-gap))}:host:dir(rtl),:host([dir=rtl]){--spectrum-logical-rotation:matrix(-1,0,0,1,0,0)}:host([selected]){--mod-actionbutton-background-color-default:var(--mod-actionbutton-background-color-default-selected,var(--spectrum-neutral-background-color-selected-default));--mod-actionbutton-background-color-hover:var(--mod-actionbutton-background-color-hover-selected,var(--spectrum-neutral-background-color-selected-hover));--mod-actionbutton-background-color-down:var(--mod-actionbutton-background-color-down-selected,var(--spectrum-neutral-background-color-selected-down));--mod-actionbutton-background-color-focus:var(--mod-actionbutton-background-color-focus-selected,var(--spectrum-neutral-background-color-selected-key-focus));--mod-actionbutton-content-color-default:var(--mod-actionbutton-content-color-default-selected,var(--spectrum-gray-50));--mod-actionbutton-content-color-hover:var(--mod-actionbutton-content-color-hover-selected,var(--spectrum-gray-50));--mod-actionbutton-content-color-down:var(--mod-actionbutton-content-color-down-selected,var(--spectrum-gray-50));--mod-actionbutton-content-color-focus:var(--mod-actionbutton-content-color-focus-selected,var(--spectrum-gray-50))}:host([selected][emphasized]){--mod-actionbutton-background-color-default:var(--mod-actionbutton-background-color-default-selected-emphasized,var(--spectrum-accent-background-color-default));--mod-actionbutton-background-color-hover:var(--mod-actionbutton-background-color-hover-selected-emphasized,var(--spectrum-accent-background-color-hover));--mod-actionbutton-background-color-down:var(--mod-actionbutton-background-color-down-selected-emphasized,var(--spectrum-accent-background-color-down));--mod-actionbutton-background-color-focus:var(--mod-actionbutton-background-color-focus-selected-emphasized,var(--spectrum-accent-background-color-key-focus));--mod-actionbutton-content-color-default:var(--mod-actionbutton-content-color-default-selected-emphasized,var(--spectrum-white));--mod-actionbutton-content-color-hover:var(--mod-actionbutton-content-color-hover-selected-emphasized,var(--spectrum-white));--mod-actionbutton-content-color-down:var(--mod-actionbutton-content-color-down-selected-emphasized,var(--spectrum-white));--mod-actionbutton-content-color-focus:var(--mod-actionbutton-content-color-focus-selected-emphasized,var(--spectrum-white))}:host([size=xs]){--spectrum-actionbutton-min-width:calc(var(--spectrum-component-edge-to-visual-only-50)*2 + var(--spectrum-workflow-icon-size-50));--spectrum-actionbutton-height:var(--spectrum-component-height-50);--spectrum-actionbutton-icon-size:var(--spectrum-workflow-icon-size-50);--spectrum-actionbutton-font-size:var(--spectrum-font-size-50);--spectrum-actionbutton-text-to-visual:var(--spectrum-text-to-visual-50);--spectrum-actionbutton-edge-to-hold-icon:var(--spectrum-action-button-edge-to-hold-icon-extra-small);--spectrum-actionbutton-edge-to-visual:calc(var(--spectrum-component-edge-to-visual-50) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-text:calc(var(--spectrum-component-edge-to-text-50) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-visual-only:calc(var(--spectrum-component-edge-to-visual-only-50) - var(--spectrum-actionbutton-border-width))}:host([size=s]){--spectrum-actionbutton-min-width:calc(var(--spectrum-component-edge-to-visual-only-75)*2 + var(--spectrum-workflow-icon-size-75));--spectrum-actionbutton-height:var(--spectrum-component-height-75);--spectrum-actionbutton-icon-size:var(--spectrum-workflow-icon-size-75);--spectrum-actionbutton-font-size:var(--spectrum-font-size-75);--spectrum-actionbutton-text-to-visual:var(--spectrum-text-to-visual-75);--spectrum-actionbutton-edge-to-hold-icon:var(--spectrum-action-button-edge-to-hold-icon-small);--spectrum-actionbutton-edge-to-visual:calc(var(--spectrum-component-edge-to-visual-75) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-text:calc(var(--spectrum-component-edge-to-text-75) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-visual-only:calc(var(--spectrum-component-edge-to-visual-only-75) - var(--spectrum-actionbutton-border-width))}:host{--spectrum-actionbutton-min-width:calc(var(--spectrum-component-edge-to-visual-only-100)*2 + var(--spectrum-workflow-icon-size-100));--spectrum-actionbutton-height:var(--spectrum-component-height-100);--spectrum-actionbutton-icon-size:var(--spectrum-workflow-icon-size-100);--spectrum-actionbutton-font-size:var(--spectrum-font-size-100);--spectrum-actionbutton-text-to-visual:var(--spectrum-text-to-visual-100);--spectrum-actionbutton-edge-to-hold-icon:var(--spectrum-action-button-edge-to-hold-icon-medium);--spectrum-actionbutton-edge-to-visual:calc(var(--spectrum-component-edge-to-visual-100) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-text:calc(var(--spectrum-component-edge-to-text-100) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-visual-only:calc(var(--spectrum-component-edge-to-visual-only-100) - var(--spectrum-actionbutton-border-width))}:host([size=l]){--spectrum-actionbutton-min-width:calc(var(--spectrum-component-edge-to-visual-only-200)*2 + var(--spectrum-workflow-icon-size-200));--spectrum-actionbutton-height:var(--spectrum-component-height-200);--spectrum-actionbutton-icon-size:var(--spectrum-workflow-icon-size-200);--spectrum-actionbutton-font-size:var(--spectrum-font-size-200);--spectrum-actionbutton-text-to-visual:var(--spectrum-text-to-visual-200);--spectrum-actionbutton-edge-to-hold-icon:var(--spectrum-action-button-edge-to-hold-icon-large);--spectrum-actionbutton-edge-to-visual:calc(var(--spectrum-component-edge-to-visual-200) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-text:calc(var(--spectrum-component-edge-to-text-200) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-visual-only:calc(var(--spectrum-component-edge-to-visual-only-200) - var(--spectrum-actionbutton-border-width))}:host([size=xl]){--spectrum-actionbutton-min-width:calc(var(--spectrum-component-edge-to-visual-only-300)*2 + var(--spectrum-workflow-icon-size-300));--spectrum-actionbutton-height:var(--spectrum-component-height-300);--spectrum-actionbutton-icon-size:var(--spectrum-workflow-icon-size-300);--spectrum-actionbutton-font-size:var(--spectrum-font-size-300);--spectrum-actionbutton-text-to-visual:var(--spectrum-text-to-visual-300);--spectrum-actionbutton-edge-to-hold-icon:var(--spectrum-action-button-edge-to-hold-icon-extra-large);--spectrum-actionbutton-edge-to-visual:calc(var(--spectrum-component-edge-to-visual-300) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-text:calc(var(--spectrum-component-edge-to-text-300) - var(--spectrum-actionbutton-border-width));--spectrum-actionbutton-edge-to-visual-only:calc(var(--spectrum-component-edge-to-visual-only-300) - var(--spectrum-actionbutton-border-width))}@media (forced-colors:active){:host{--highcontrast-actionbutton-focus-indicator-color:ButtonText}:host:after{forced-color-adjust:none}:host([selected]){--highcontrast-actionbutton-background-color-default:Highlight;--highcontrast-actionbutton-background-color-hover:Highlight;--highcontrast-actionbutton-background-color-focus:Highlight;--highcontrast-actionbutton-background-color-down:Highlight;--highcontrast-actionbutton-background-color-disabled:ButtonFace;--highcontrast-actionbutton-border-color-default:HighlightText;--highcontrast-actionbutton-border-color-hover:HighlightText;--highcontrast-actionbutton-border-color-focus:HighlightText;--highcontrast-actionbutton-border-color-down:HighlightText;--highcontrast-actionbutton-border-color-disabled:GrayText;--highcontrast-actionbutton-content-color-default:HighlightText;--highcontrast-actionbutton-content-color-hover:HighlightText;--highcontrast-actionbutton-content-color-focus:HighlightText;--highcontrast-actionbutton-content-color-down:HighlightText;--highcontrast-actionbutton-content-color-disabled:GrayText}:host([selected]) .hold-affordance,:host([selected]) ::slotted([slot=icon]),:host([selected]) #label{forced-color-adjust:none}}:host{min-inline-size:var(--mod-actionbutton-min-width,var(--spectrum-actionbutton-min-width));block-size:var(--mod-actionbutton-height,var(--spectrum-actionbutton-height));border-radius:var(--mod-actionbutton-border-radius,var(--spectrum-actionbutton-border-radius));border-width:var(--mod-actionbutton-border-width,var(--spectrum-actionbutton-border-width));gap:calc(var(--mod-actionbutton-text-to-visual,var(--spectrum-actionbutton-text-to-visual)) + var(--mod-actionbutton-edge-to-text,var(--spectrum-actionbutton-edge-to-text)) - var(--mod-actionbutton-edge-to-visual-only,var(--spectrum-actionbutton-edge-to-visual-only)));padding-inline:var(--mod-actionbutton-edge-to-text,var(--spectrum-actionbutton-edge-to-text));background-color:var(--highcontrast-actionbutton-background-color-default,var(--mod-actionbutton-background-color-default,var(--spectrum-actionbutton-background-color-default)));border-color:var(--highcontrast-actionbutton-border-color-default,var(--mod-actionbutton-border-color-default,var(--spectrum-actionbutton-border-color-default)));color:var(--highcontrast-actionbutton-content-color-default,var(--mod-actionbutton-content-color-default,var(--spectrum-actionbutton-content-color-default)));position:relative}@media (hover:hover){:host(:hover){background-color:var(--highcontrast-actionbutton-background-color-hover,var(--mod-actionbutton-background-color-hover,var(--spectrum-actionbutton-background-color-hover)));border-color:var(--highcontrast-actionbutton-border-color-hover,var(--mod-actionbutton-border-color-hover,var(--spectrum-actionbutton-border-color-hover)));color:var(--highcontrast-actionbutton-content-color-hover,var(--mod-actionbutton-content-color-hover,var(--spectrum-actionbutton-content-color-hover)))}}:host(:focus-visible){background-color:var(--highcontrast-actionbutton-background-color-focus,var(--mod-actionbutton-background-color-focus,var(--spectrum-actionbutton-background-color-focus)));border-color:var(--highcontrast-actionbutton-border-color-focus,var(--mod-actionbutton-border-color-focus,var(--spectrum-actionbutton-border-color-focus)));color:var(--highcontrast-actionbutton-content-color-focus,var(--mod-actionbutton-content-color-focus,var(--spectrum-actionbutton-content-color-focus)))}:host(:is(:active,[active])){background-color:var(--highcontrast-actionbutton-background-color-down,var(--mod-actionbutton-background-color-down,var(--spectrum-actionbutton-background-color-down)));border-color:var(--highcontrast-actionbutton-border-color-down,var(--mod-actionbutton-border-color-down,var(--spectrum-actionbutton-border-color-down)));color:var(--highcontrast-actionbutton-content-color-down,var(--mod-actionbutton-content-color-down,var(--spectrum-actionbutton-content-color-down)))}:host([disabled]),:host([disabled]){background-color:var(--highcontrast-actionbutton-background-color-disabled,var(--mod-actionbutton-background-color-disabled,var(--spectrum-actionbutton-background-color-disabled)));border-color:var(--highcontrast-actionbutton-border-color-disabled,var(--mod-actionbutton-border-color-disabled,var(--spectrum-actionbutton-border-color-disabled)));color:var(--highcontrast-actionbutton-content-color-disabled,var(--mod-actionbutton-content-color-disabled,var(--spectrum-actionbutton-content-color-disabled)))}::slotted([slot=icon]){inline-size:var(--mod-actionbutton-icon-size,var(--spectrum-actionbutton-icon-size));block-size:var(--mod-actionbutton-icon-size,var(--spectrum-actionbutton-icon-size));color:inherit;margin-inline-start:calc(var(--mod-actionbutton-edge-to-visual,var(--spectrum-actionbutton-edge-to-visual)) - var(--mod-actionbutton-edge-to-text,var(--spectrum-actionbutton-edge-to-text)));margin-inline-end:calc(var(--mod-actionbutton-edge-to-visual-only,var(--spectrum-actionbutton-edge-to-visual-only)) - var(--mod-actionbutton-edge-to-text,var(--spectrum-actionbutton-edge-to-text)))}.hold-affordance+::slotted([slot=icon]),[icon-only]::slotted([slot=icon]){margin-inline-start:calc(var(--mod-actionbutton-edge-to-visual-only,var(--spectrum-actionbutton-edge-to-visual-only)) - var(--mod-actionbutton-edge-to-text,var(--spectrum-actionbutton-edge-to-text)))}#label{pointer-events:none;font-size:var(--mod-actionbutton-font-size,var(--spectrum-actionbutton-font-size));white-space:nowrap;color:var(--mod-actionbutton-label-color,inherit);text-overflow:ellipsis;overflow:hidden}.hold-affordance{color:inherit;transform:var(--spectrum-logical-rotation);position:absolute;inset-block-end:calc(var(--mod-actionbutton-edge-to-hold-icon,var(--spectrum-actionbutton-edge-to-hold-icon)) - var(--mod-actionbutton-border-width,var(--spectrum-actionbutton-border-width)));inset-inline-end:calc(var(--mod-actionbutton-edge-to-hold-icon,var(--spectrum-actionbutton-edge-to-hold-icon)) - var(--mod-actionbutton-border-width,var(--spectrum-actionbutton-border-width)))}:host{transition:border-color var(--mod-actionbutton-animation-duration,var(--spectrum-actionbutton-animation-duration))ease-in-out}:host:after{margin:calc(( var(--mod-actionbutton-focus-indicator-gap,var(--spectrum-actionbutton-focus-indicator-gap)) + var(--mod-actionbutton-border-width,var(--spectrum-actionbutton-border-width)))*-1);border-radius:var(--mod-actionbutton-focus-indicator-border-radius,var(--spectrum-actionbutton-focus-indicator-border-radius));transition:box-shadow var(--mod-actionbutton-animation-duration,var(--spectrum-actionbutton-animation-duration))ease-in-out;pointer-events:none;content:"";position:absolute;inset:0}:host(:focus-visible){box-shadow:none;outline:none}:host(:focus-visible):after{box-shadow:0 0 0 var(--mod-actionbutton-focus-indicator-thickness,var(--spectrum-actionbutton-focus-indicator-thickness))var(--highcontrast-actionbutton-focus-indicator-color,var(--mod-actionbutton-focus-indicator-color,var(--spectrum-actionbutton-focus-indicator-color)))}:host{--spectrum-actionbutton-background-color-default:var(--system-spectrum-actionbutton-background-color-default);--spectrum-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-background-color-hover);--spectrum-actionbutton-background-color-down:var(--system-spectrum-actionbutton-background-color-down);--spectrum-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-background-color-focus);--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-border-color-focus);--spectrum-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-background-color-disabled);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-border-color-disabled);--spectrum-actionbutton-content-color-disabled:var(--system-spectrum-actionbutton-content-color-disabled)}:host([quiet]){--spectrum-actionbutton-background-color-default:var(--system-spectrum-actionbutton-quiet-background-color-default);--spectrum-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-quiet-background-color-hover);--spectrum-actionbutton-background-color-down:var(--system-spectrum-actionbutton-quiet-background-color-down);--spectrum-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-quiet-background-color-focus);--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-quiet-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-quiet-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-quiet-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-quiet-border-color-focus);--spectrum-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-quiet-background-color-disabled);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-quiet-border-color-disabled)}:host([selected]){--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-selected-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-selected-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-selected-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-selected-border-color-focus);--spectrum-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-selected-background-color-disabled);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-selected-border-color-disabled)}:host([static=black][quiet]){--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-staticblack-quiet-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-staticblack-quiet-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-staticblack-quiet-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-staticblack-quiet-border-color-focus);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticblack-quiet-border-color-disabled)}:host([static=white][quiet]){--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-staticwhite-quiet-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-staticwhite-quiet-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-staticwhite-quiet-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-staticwhite-quiet-border-color-focus);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticwhite-quiet-border-color-disabled)}:host([static=black]){--spectrum-actionbutton-background-color-default:var(--system-spectrum-actionbutton-staticblack-background-color-default);--spectrum-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-staticblack-background-color-hover);--spectrum-actionbutton-background-color-down:var(--system-spectrum-actionbutton-staticblack-background-color-down);--spectrum-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-staticblack-background-color-focus);--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-staticblack-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-staticblack-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-staticblack-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-staticblack-border-color-focus);--spectrum-actionbutton-content-color-default:var(--system-spectrum-actionbutton-staticblack-content-color-default);--spectrum-actionbutton-content-color-hover:var(--system-spectrum-actionbutton-staticblack-content-color-hover);--spectrum-actionbutton-content-color-down:var(--system-spectrum-actionbutton-staticblack-content-color-down);--spectrum-actionbutton-content-color-focus:var(--system-spectrum-actionbutton-staticblack-content-color-focus);--spectrum-actionbutton-focus-indicator-color:var(--system-spectrum-actionbutton-staticblack-focus-indicator-color);--spectrum-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-staticblack-background-color-disabled);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticblack-border-color-disabled);--spectrum-actionbutton-content-color-disabled:var(--system-spectrum-actionbutton-staticblack-content-color-disabled)}:host([static=black][selected]){--mod-actionbutton-background-color-default:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-default);--mod-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-hover);--mod-actionbutton-background-color-down:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-down);--mod-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-focus);--mod-actionbutton-content-color-default:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-default));--mod-actionbutton-content-color-hover:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-hover));--mod-actionbutton-content-color-down:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-down));--mod-actionbutton-content-color-focus:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-focus));--mod-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-disabled);--mod-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-border-color-disabled)}:host([static=white]){--spectrum-actionbutton-background-color-default:var(--system-spectrum-actionbutton-staticwhite-background-color-default);--spectrum-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-staticwhite-background-color-hover);--spectrum-actionbutton-background-color-down:var(--system-spectrum-actionbutton-staticwhite-background-color-down);--spectrum-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-staticwhite-background-color-focus);--spectrum-actionbutton-border-color-default:var(--system-spectrum-actionbutton-staticwhite-border-color-default);--spectrum-actionbutton-border-color-hover:var(--system-spectrum-actionbutton-staticwhite-border-color-hover);--spectrum-actionbutton-border-color-down:var(--system-spectrum-actionbutton-staticwhite-border-color-down);--spectrum-actionbutton-border-color-focus:var(--system-spectrum-actionbutton-staticwhite-border-color-focus);--spectrum-actionbutton-content-color-default:var(--system-spectrum-actionbutton-staticwhite-content-color-default);--spectrum-actionbutton-content-color-hover:var(--system-spectrum-actionbutton-staticwhite-content-color-hover);--spectrum-actionbutton-content-color-down:var(--system-spectrum-actionbutton-staticwhite-content-color-down);--spectrum-actionbutton-content-color-focus:var(--system-spectrum-actionbutton-staticwhite-content-color-focus);--spectrum-actionbutton-focus-indicator-color:var(--system-spectrum-actionbutton-staticwhite-focus-indicator-color);--spectrum-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-staticwhite-background-color-disabled);--spectrum-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticwhite-border-color-disabled);--spectrum-actionbutton-content-color-disabled:var(--system-spectrum-actionbutton-staticwhite-content-color-disabled)}:host([static=white][selected]){--mod-actionbutton-background-color-default:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-default);--mod-actionbutton-background-color-hover:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-hover);--mod-actionbutton-background-color-down:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-down);--mod-actionbutton-background-color-focus:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-focus);--mod-actionbutton-content-color-default:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-default));--mod-actionbutton-content-color-hover:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-hover));--mod-actionbutton-content-color-down:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-down));--mod-actionbutton-content-color-focus:var(--mod-actionbutton-static-content-color,var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-focus));--mod-actionbutton-background-color-disabled:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-disabled);--mod-actionbutton-border-color-disabled:var(--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-border-color-disabled)}::slotted([slot=icon]){flex-shrink:0}#label{flex-grow:var(--spectrum-actionbutton-label-flex-grow);text-align:var(--spectrum-actionbutton-label-text-align);pointer-events:none!important}:host([size=xs]){min-width:var(--spectrum-actionbutton-height,0)}@media (forced-colors:active){:host{--highcontrast-actionbutton-border-color-disabled:GrayText;--highcontrast-actionbutton-content-color-disabled:GrayText}}
`;
var action_button_css_default = o15;

// ../node_modules/@spectrum-web-components/icon/src/spectrum-icon-corner-triangle.css.js
init_src();
var e13 = i3`
    .spectrum-UIIcon-CornerTriangle75{--spectrum-icon-size:var(--spectrum-corner-triangle-icon-size-75)}.spectrum-UIIcon-CornerTriangle100{--spectrum-icon-size:var(--spectrum-corner-triangle-icon-size-100)}.spectrum-UIIcon-CornerTriangle200{--spectrum-icon-size:var(--spectrum-corner-triangle-icon-size-200)}.spectrum-UIIcon-CornerTriangle300{--spectrum-icon-size:var(--spectrum-corner-triangle-icon-size-300)}
`;
var spectrum_icon_corner_triangle_css_default = e13;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCornerTriangle300.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/CornerTriangle300.js
var CornerTriangle300Icon = ({ width: e22 = 24, height: r16 = 24, title: t16 = "Corner Triangle300" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 7 7"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${t16}
    width=${e22}
    height=${r16}
  >
    <path
      d="M6.683.67a.32.32 0 0 0-.223.093l-5.7 5.7a.316.316 0 0 0 .224.54h5.7A.316.316 0 0 0 7 6.687V.986A.316.316 0 0 0 6.684.67z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCornerTriangle300.js
var IconCornerTriangle300 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), CornerTriangle300Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-corner-triangle300.js
init_define_element();
defineElement("sp-icon-corner-triangle300", IconCornerTriangle300);

// ../node_modules/@spectrum-web-components/action-button/src/ActionButton.js
var p9 = Object.defineProperty;
var u11 = Object.getOwnPropertyDescriptor;
var i13 = (a10, o26, e22, t16) => {
  for (var r16 = t16 > 1 ? void 0 : t16 ? u11(o26, e22) : o26, n18 = a10.length - 1, l14; n18 >= 0; n18--) (l14 = a10[n18]) && (r16 = (t16 ? l14(o26, e22, r16) : l14(r16)) || r16);
  return t16 && r16 && p9(o26, e22, r16), r16;
};
var m7 = { xs: "spectrum-UIIcon-CornerTriangle75", s: "spectrum-UIIcon-CornerTriangle75", m: "spectrum-UIIcon-CornerTriangle100", l: "spectrum-UIIcon-CornerTriangle200", xl: "spectrum-UIIcon-CornerTriangle300" };
var LONGPRESS_DURATION = 300;
var d7;
var ActionButton = class extends SizedMixin(ButtonBase, { validSizes: ["xs", "s", "m", "l", "xl"], noDefaultSize: true }) {
  constructor() {
    super();
    this.emphasized = false;
    this.holdAffordance = false;
    this.quiet = false;
    this.role = "button";
    this.selected = false;
    this.toggles = false;
    this._value = "";
    this.onClick = () => {
      if (!this.toggles) return;
      this.selected = !this.selected, this.dispatchEvent(new Event("change", { cancelable: true, bubbles: true, composed: true })) || (this.selected = !this.selected);
    };
    this.addEventListener("click", this.onClick);
  }
  static get styles() {
    return [...super.styles, action_button_css_default, spectrum_icon_corner_triangle_css_default];
  }
  get value() {
    return this._value || this.itemText;
  }
  set value(e22) {
    e22 !== this._value && (this._value = e22 || "", this._value ? this.setAttribute("value", this._value) : this.removeAttribute("value"));
  }
  get itemText() {
    return (this.textContent || "").trim();
  }
  handlePointerdownHoldAffordance(e22) {
    e22.button === 0 && (this.addEventListener("pointerup", this.handlePointerupHoldAffordance), this.addEventListener("pointercancel", this.handlePointerupHoldAffordance), d7 = setTimeout(() => {
      this.dispatchEvent(new CustomEvent("longpress", { bubbles: true, composed: true, detail: { source: "pointer" } }));
    }, LONGPRESS_DURATION));
  }
  handlePointerupHoldAffordance() {
    clearTimeout(d7), this.removeEventListener("pointerup", this.handlePointerupHoldAffordance), this.removeEventListener("pointercancel", this.handlePointerupHoldAffordance);
  }
  handleKeydown(e22) {
    if (!this.holdAffordance) return super.handleKeydown(e22);
    const { code: t16, altKey: r16 } = e22;
    (t16 === "Space" || r16 && t16 === "ArrowDown") && (e22.preventDefault(), t16 === "ArrowDown" && (e22.stopPropagation(), e22.stopImmediatePropagation()), this.addEventListener("keyup", this.handleKeyup), this.active = true);
  }
  handleKeyup(e22) {
    if (!this.holdAffordance) return super.handleKeyup(e22);
    const { code: t16, altKey: r16 } = e22;
    (t16 === "Space" || r16 && t16 === "ArrowDown") && (e22.stopPropagation(), this.dispatchEvent(new CustomEvent("longpress", { bubbles: true, composed: true, detail: { source: "keyboard" } })), this.active = false);
  }
  get buttonContent() {
    const e22 = super.buttonContent;
    return this.holdAffordance && e22.unshift(x`
                <sp-icon-corner-triangle300
                    class="hold-affordance ${m7[this.size]}"
                ></sp-icon-corner-triangle300>
            `), e22;
  }
  updated(e22) {
    super.updated(e22);
    const t16 = this.role === "button", r16 = t16 && (this.selected || this.toggles) && !(this.hasAttribute("aria-haspopup") && this.hasAttribute("aria-expanded"));
    (e22.has("selected") || e22.has("role")) && (r16 ? this.setAttribute("aria-pressed", this.selected ? "true" : "false") : (this.removeAttribute("aria-pressed"), t16 && this.toggles && this.hasAttribute("aria-expanded") && this.setAttribute("aria-expanded", this.selected ? "true" : "false"))), e22.has("variant") && (this.variant || typeof e22.get("variant")) && (this.static = this.variant), e22.has("holdAffordance") && (this.holdAffordance ? this.addEventListener("pointerdown", this.handlePointerdownHoldAffordance) : (this.removeEventListener("pointerdown", this.handlePointerdownHoldAffordance), this.handlePointerupHoldAffordance()));
  }
};
i13([n7({ type: Boolean, reflect: true })], ActionButton.prototype, "emphasized", 2), i13([n7({ type: Boolean, reflect: true, attribute: "hold-affordance" })], ActionButton.prototype, "holdAffordance", 2), i13([n7({ type: Boolean, reflect: true })], ActionButton.prototype, "quiet", 2), i13([n7({ reflect: true })], ActionButton.prototype, "role", 2), i13([n7({ type: Boolean, reflect: true })], ActionButton.prototype, "selected", 2), i13([n7({ type: Boolean, reflect: true })], ActionButton.prototype, "toggles", 2), i13([n7({ reflect: true })], ActionButton.prototype, "static", 2), i13([n7({ reflect: true })], ActionButton.prototype, "variant", 2), i13([n7({ type: String })], ActionButton.prototype, "value", 1);

// ../node_modules/@spectrum-web-components/action-button/sp-action-button.js
init_define_element();
defineElement("sp-action-button", ActionButton);

// ../node_modules/@spectrum-web-components/button-group/src/ButtonGroup.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/button-group/src/button-group.css.js
init_src();
var o16 = i3`
    :host{--spectrum-buttongroup-spacing-horizontal:var(--spectrum-spacing-300);--spectrum-buttongroup-spacing-vertical:var(--spectrum-spacing-300)}:host([size=s]){--spectrum-buttongroup-spacing-horizontal:var(--spectrum-spacing-200);--spectrum-buttongroup-spacing-vertical:var(--spectrum-spacing-200)}:host([size=l]),:host,:host([size=xl]){--spectrum-buttongroup-spacing-horizontal:var(--spectrum-spacing-300);--spectrum-buttongroup-spacing-vertical:var(--spectrum-spacing-300)}:host{gap:var(--mod-buttongroup-spacing-horizontal,var(--spectrum-buttongroup-spacing-horizontal));justify-content:var(--mod-buttongroup-justify-content,normal);flex-wrap:wrap;display:flex}::slotted(*){flex-shrink:0}:host([vertical]){gap:var(--mod-buttongroup-spacing-vertical,var(--spectrum-buttongroup-spacing-vertical));flex-direction:column;display:inline-flex}:host([vertical]) ::slotted(sp-action-button){--spectrum-actionbutton-label-flex-grow:1}:host([dir=ltr][vertical]) ::slotted(sp-action-button){--spectrum-actionbutton-label-text-align:left}:host([dir=rtl][vertical]) ::slotted(sp-action-button){--spectrum-actionbutton-label-text-align:right}
`;
var button_group_css_default = o16;

// ../node_modules/@spectrum-web-components/button-group/src/ButtonGroup.js
var i14 = Object.defineProperty;
var m8 = Object.getOwnPropertyDescriptor;
var a7 = (o26, t16, r16, s14) => {
  for (var e22 = s14 > 1 ? void 0 : s14 ? m8(t16, r16) : t16, l14 = o26.length - 1, n18; l14 >= 0; l14--) (n18 = o26[l14]) && (e22 = (s14 ? n18(t16, r16, e22) : n18(e22)) || e22);
  return s14 && e22 && i14(t16, r16, e22), e22;
};
var ButtonGroup = class extends SizedMixin(SpectrumElement, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.vertical = false;
  }
  static get styles() {
    return [button_group_css_default];
  }
  handleSlotchange({ target: r16 }) {
    r16.assignedElements().forEach((e22) => {
      e22.size = this.size;
    });
  }
  render() {
    return x`
            <slot @slotchange=${this.handleSlotchange}></slot>
        `;
  }
};
a7([n7({ type: Boolean, reflect: true })], ButtonGroup.prototype, "vertical", 2);

// ../node_modules/@spectrum-web-components/button-group/sp-button-group.js
init_define_element();
defineElement("sp-button-group", ButtonGroup);

// ../node_modules/@spectrum-web-components/button/sp-button.js
init_define_element();
defineElement("sp-button", Button);

// ../node_modules/@spectrum-web-components/dialog/src/Dialog.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/divider/src/Divider.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/divider/src/divider.css.js
init_src();
var i15 = i3`
    :host{--spectrum-divider-thickness:var(--spectrum-divider-thickness-medium);--spectrum-divider-background-color:var(--spectrum-divider-background-color-medium);--spectrum-divider-background-color-small:var(--spectrum-gray-300);--spectrum-divider-background-color-medium:var(--spectrum-gray-300);--spectrum-divider-background-color-large:var(--spectrum-gray-800);--spectrum-divider-background-color-small-static-white:var(--spectrum-transparent-white-300);--spectrum-divider-background-color-medium-static-white:var(--spectrum-transparent-white-300);--spectrum-divider-background-color-large-static-white:var(--spectrum-transparent-white-800);--spectrum-divider-background-color-small-static-black:var(--spectrum-transparent-black-300);--spectrum-divider-background-color-medium-static-black:var(--spectrum-transparent-black-300);--spectrum-divider-background-color-large-static-black:var(--spectrum-transparent-black-800)}:host([size=s]){--spectrum-divider-thickness:var(--spectrum-divider-thickness-small);--spectrum-divider-background-color:var(--spectrum-divider-background-color-small)}:host{--spectrum-divider-thickness:var(--spectrum-divider-thickness-medium);--spectrum-divider-background-color:var(--spectrum-divider-background-color-medium)}:host([size=l]){--spectrum-divider-thickness:var(--spectrum-divider-thickness-large);--spectrum-divider-background-color:var(--spectrum-divider-background-color-large)}@media (forced-colors:active){:host,:host([size=l]),:host,:host([size=s]){--spectrum-divider-background-color:CanvasText;--spectrum-divider-background-color-small-static-white:CanvasText;--spectrum-divider-background-color-medium-static-white:CanvasText;--spectrum-divider-background-color-large-static-white:CanvasText;--spectrum-divider-background-color-small-static-black:CanvasText;--spectrum-divider-background-color-medium-static-black:CanvasText;--spectrum-divider-background-color-large-static-black:CanvasText}}:host{block-size:var(--mod-divider-thickness,var(--spectrum-divider-thickness));border:none;border-width:var(--mod-divider-thickness,var(--spectrum-divider-thickness));border-radius:var(--mod-divider-thickness,var(--spectrum-divider-thickness));background-color:var(--mod-divider-background-color,var(--spectrum-divider-background-color));inline-size:100%;overflow:visible}:host([static=white][size=s]){--spectrum-divider-background-color:var(--mod-divider-background-color-small-static-white,var(--spectrum-divider-background-color-small-static-white))}:host([static=white]){--spectrum-divider-background-color:var(--mod-divider-background-color-medium-static-white,var(--spectrum-divider-background-color-medium-static-white))}:host([static=white][size=l]){--spectrum-divider-background-color:var(--mod-divider-background-color-large-static-white,var(--spectrum-divider-background-color-large-static-white))}:host([static=black][size=s]){--spectrum-divider-background-color:var(--mod-divider-background-color-small-static-black,var(--spectrum-divider-background-color-small-static-black))}:host([static=black]){--spectrum-divider-background-color:var(--mod-divider-background-color-medium-static-black,var(--spectrum-divider-background-color-medium-static-black))}:host([static=black][size=l]){--spectrum-divider-background-color:var(--mod-divider-background-color-large-static-black,var(--spectrum-divider-background-color-large-static-black))}:host([vertical]){inline-size:var(--mod-divider-thickness,var(--spectrum-divider-thickness));margin-block:var(--mod-divider-vertical-margin);block-size:var(--mod-divider-vertical-height,100%);align-self:var(--mod-divider-vertical-align)}:host{display:block}hr{border:none;margin:0}
`;
var divider_css_default = i15;

// ../node_modules/@spectrum-web-components/divider/src/Divider.js
var p10 = Object.defineProperty;
var u12 = Object.getOwnPropertyDescriptor;
var l11 = (s14, r16, e22, i20) => {
  for (var t16 = i20 > 1 ? void 0 : i20 ? u12(r16, e22) : r16, o26 = s14.length - 1, a10; o26 >= 0; o26--) (a10 = s14[o26]) && (t16 = (i20 ? a10(r16, e22, t16) : a10(t16)) || t16);
  return i20 && t16 && p10(r16, e22, t16), t16;
};
var Divider = class extends SizedMixin(SpectrumElement, { validSizes: ["s", "m", "l"], noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.vertical = false;
  }
  render() {
    return x``;
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.setAttribute("role", "separator");
  }
  updated(e22) {
    super.updated(e22), e22.has("vertical") && (this.vertical ? this.setAttribute("aria-orientation", "vertical") : this.removeAttribute("aria-orientation"));
  }
};
Divider.styles = [divider_css_default], l11([n7({ type: Boolean, reflect: true })], Divider.prototype, "vertical", 2);

// ../node_modules/@spectrum-web-components/divider/sp-divider.js
init_define_element();
defineElement("sp-divider", Divider);

// ../node_modules/@spectrum-web-components/button/sp-close-button.js
init_define_element();
defineElement("sp-close-button", CloseButton);

// ../node_modules/@spectrum-web-components/icons-workflow/src/elements/IconAlert.js
init_src();

// ../node_modules/@spectrum-web-components/icons-workflow/src/custom-tag.js
var t9;
var tag2 = function(e22, ...a10) {
  return t9 ? t9(e22, ...a10) : a10.reduce((r16, p18, l14) => r16 + p18 + e22[l14 + 1], e22[0]);
};
var setCustomTemplateLiteralTag2 = (e22) => {
  t9 = e22;
};

// ../node_modules/@spectrum-web-components/icons-workflow/src/icons/Alert.js
var AlertIcon = ({ width: a10 = 24, height: t16 = 24, hidden: e22 = false, title: r16 = "Alert" } = {}) => tag2`<svg
    xmlns="http://www.w3.org/2000/svg"
    height=${t16}
    viewBox="0 0 36 36"
    width=${a10}
    aria-hidden=${e22 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label=${r16}
  >
    <path
      d="M17.127 2.579.4 32.512A1 1 0 0 0 1.272 34h33.456a1 1 0 0 0 .872-1.488L18.873 2.579a1 1 0 0 0-1.746 0ZM20 29.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5Zm0-6a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5Z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-workflow/src/elements/IconAlert.js
var IconAlert = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag2(x), AlertIcon({ hidden: !this.label, title: this.label });
  }
};

// ../node_modules/@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js
init_define_element();
defineElement("sp-icon-alert", IconAlert);

// ../node_modules/@spectrum-web-components/dialog/src/Dialog.js
init_src2();

// ../node_modules/@spectrum-web-components/dialog/src/dialog.css.js
init_src();
var o18 = i3`
    :host{--spectrum-dialog-fullscreen-header-text-size:28px;--spectrum-dialog-min-inline-size:288px;--spectrum-dialog-confirm-small-width:400px;--spectrum-dialog-confirm-medium-width:480px;--spectrum-dialog-confirm-large-width:640px;--spectrum-dialog-confirm-divider-block-spacing-start:var(--spectrum-spacing-300);--spectrum-dialog-confirm-divider-block-spacing-end:var(--spectrum-spacing-200);--spectrum-dialog-confirm-description-text-color:var(--spectrum-gray-800);--spectrum-dialog-confirm-title-text-color:var(--spectrum-gray-900);--spectrum-dialog-confirm-description-text-line-height:var(--spectrum-line-height-100);--spectrum-dialog-confirm-title-text-line-height:var(--spectrum-line-height-100);--spectrum-dialog-heading-font-weight:var(--spectrum-heading-sans-serif-font-weight);--spectrum-dialog-confirm-description-padding:var(--spectrum-spacing-50);--spectrum-dialog-confirm-description-margin:calc(var(--spectrum-spacing-50)*-1);--spectrum-dialog-confirm-footer-padding-top:var(--spectrum-spacing-600);--spectrum-dialog-confirm-gap-size:var(--spectrum-component-pill-edge-to-text-100);--spectrum-dialog-confirm-buttongroup-padding-top:var(--spectrum-spacing-600);--spectrum-dialog-confirm-close-button-size:var(--spectrum-component-height-100);--spectrum-dialog-confirm-close-button-padding:calc(26px - var(--spectrum-component-bottom-to-text-300));--spectrum-dialog-confirm-divider-height:var(--spectrum-spacing-50);box-sizing:border-box;min-inline-size:var(--mod-dialog-min-inline-size,var(--spectrum-dialog-min-inline-size));max-block-size:inherit;outline:none;inline-size:fit-content;max-inline-size:100%;display:flex}:host([size=s]){inline-size:var(--mod-dialog-confirm-small-width,var(--spectrum-dialog-confirm-small-width))}:host([size=m]){inline-size:var(--mod-dialog-confirm-medium-width,var(--spectrum-dialog-confirm-medium-width))}:host([size=l]){inline-size:var(--mod-dialog-confirm-large-width,var(--spectrum-dialog-confirm-large-width))}::slotted([slot=hero]){block-size:var(--mod-dialog-confirm-hero-height,var(--spectrum-dialog-confirm-hero-height));background-position:50%;background-size:cover;border-start-start-radius:var(--mod-dialog-confirm-border-radius,var(--spectrum-dialog-confirm-border-radius));border-start-end-radius:var(--mod-dialog-confirm-border-radius,var(--spectrum-dialog-confirm-border-radius));grid-area:a;overflow:hidden}.grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto 1fr auto minmax(0,auto)var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-rows:auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto auto 1fr auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:"a a a a a a"". . . . . ."".b c c c."".d d d d."".e e e e."".f f g g."". . . . . .";inline-size:100%;display:grid}::slotted([slot=heading]){font-size:var(--mod-dialog-confirm-title-text-size,var(--spectrum-dialog-confirm-title-text-size));font-weight:var(--mod-dialog-heading-font-weight,var(--spectrum-dialog-heading-font-weight));line-height:var(--mod-dialog-confirm-title-text-line-height,var(--spectrum-dialog-confirm-title-text-line-height));color:var(--mod-dialog-confirm-title-text-color,var(--spectrum-dialog-confirm-title-text-color));outline:none;grid-area:b;margin:0;padding-inline-end:var(--mod-dialog-confirm-gap-size,var(--spectrum-dialog-confirm-gap-size))}.no-header::slotted([slot=heading]){grid-area:h/h/i/i;padding-inline-end:0}.header{box-sizing:border-box;outline:none;grid-area:c;justify-content:flex-end;align-items:center;display:flex}.divider{grid-area:d;inline-size:100%;margin-block-start:var(--mod-dialog-confirm-divider-block-spacing-end,var(--spectrum-dialog-confirm-divider-block-spacing-end));margin-block-end:var(--mod-dialog-confirm-divider-block-spacing-start,var(--spectrum-dialog-confirm-divider-block-spacing-start))}:host([mode=fullscreen]) [name=heading]+.divider{margin-block-end:calc(var(--mod-dialog-confirm-divider-block-spacing-start,var(--spectrum-dialog-confirm-divider-block-spacing-start)) - var(--mod-dialog-confirm-description-padding,var(--spectrum-dialog-confirm-description-padding))*2)}:host([no-divider]) .divider{display:none}:host([no-divider]) ::slotted([slot=heading]){padding-block-end:calc(var(--mod-dialog-confirm-divider-block-spacing-end,var(--spectrum-dialog-confirm-divider-block-spacing-end)) + var(--mod-dialog-confirm-divider-block-spacing-start,var(--spectrum-dialog-confirm-divider-block-spacing-start)) + var(--mod-dialog-confirm-divider-height,var(--spectrum-dialog-confirm-divider-height)))}.content{box-sizing:border-box;-webkit-overflow-scrolling:touch;font-size:var(--mod-dialog-confirm-description-text-size,var(--spectrum-dialog-confirm-description-text-size));font-weight:var(--mod-dialog-confirm-description-font-weight,var(--spectrum-regular-font-weight));line-height:var(--mod-dialog-confirm-description-text-line-height,var(--spectrum-dialog-confirm-description-text-line-height));color:var(--mod-dialog-confirm-description-text-color,var(--spectrum-dialog-confirm-description-text-color));padding:calc(var(--mod-dialog-confirm-description-padding,var(--spectrum-dialog-confirm-description-padding))*2);margin:0 var(--mod-dialog-confirm-description-margin,var(--spectrum-dialog-confirm-description-margin));outline:none;grid-area:e;overflow-y:auto}.footer{outline:none;flex-wrap:wrap;grid-area:f;padding-block-start:var(--mod-dialog-confirm-footer-padding-top,var(--spectrum-dialog-confirm-footer-padding-top));display:flex}.footer>*,.footer>.spectrum-Button+.spectrum-Button{margin-block-end:0}.button-group{grid-area:g;justify-content:flex-end;padding-block-start:var(--mod-dialog-confirm-buttongroup-padding-top,var(--spectrum-dialog-confirm-buttongroup-padding-top));padding-inline-start:var(--mod-dialog-confirm-gap-size,var(--spectrum-dialog-confirm-gap-size));display:flex}:host([dismissable]) .grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto 1fr auto minmax(0,auto)minmax(0,var(--mod-dialog-confirm-close-button-size,var(--spectrum-dialog-confirm-close-button-size)))var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-rows:auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto auto 1fr auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:"a a a a a a a"". . . . .l l"".b c c m l l"".d d d d d."".e e e e e."".f f g g g."". . . . . . ."}:host([dismissable]) .grid .button-group{display:none}:host([dismissable]) .grid .footer{color:var(--mod-dialog-confirm-description-text-color,var(--spectrum-dialog-confirm-description-text-color));grid-area:f/f/g/g}.close-button{grid-area:l;place-self:start end;margin-block-start:var(--mod-dialog-confirm-close-button-padding,var(--spectrum-dialog-confirm-close-button-padding));margin-inline-end:var(--mod-dialog-confirm-close-button-padding,var(--spectrum-dialog-confirm-close-button-padding))}:host([mode=fullscreen]){block-size:100%;inline-size:100%}:host([mode=fullscreenTakeover]){border-radius:0;block-size:100%;inline-size:100%}:host([mode=fullscreen]),:host([mode=fullscreenTakeover]){max-block-size:none;max-inline-size:none}:host([mode=fullscreen]) .grid,:host([mode=fullscreenTakeover]) .grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))1fr auto auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-rows:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto auto 1fr var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:". . . . ."".b c g."".d d d."".e e e."". . . . .";display:grid}:host([mode=fullscreen]) ::slotted([slot=heading]),:host([mode=fullscreenTakeover]) ::slotted([slot=heading]){font-size:var(--mod-dialog-fullscreen-header-text-size,var(--spectrum-dialog-fullscreen-header-text-size))}:host([mode=fullscreen]) .content,:host([mode=fullscreenTakeover]) .content{max-block-size:none}:host([mode=fullscreen]) .button-group,:host([mode=fullscreen]) .footer,:host([mode=fullscreenTakeover]) .button-group,:host([mode=fullscreenTakeover]) .footer{padding-block-start:0}:host([mode=fullscreen]) .footer,:host([mode=fullscreenTakeover]) .footer{display:none}:host([mode=fullscreen]) .button-group,:host([mode=fullscreenTakeover]) .button-group{grid-area:g;align-self:start}@media screen and (width<=700px){.grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto 1fr auto minmax(0,auto)var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:"a a a a a a"". . . . . ."".b b b b."".c c c c."".d d d d."".e e e e."".f f g g."". . . . . ."}.grid,:host([dismissable]) .grid{grid-template-rows:auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto auto auto 1fr auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))}:host([dismissable]) .grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto 1fr auto minmax(0,auto)minmax(0,var(--mod-dialog-confirm-close-button-size,var(--spectrum-dialog-confirm-close-button-size)))var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:"a a a a a a a"". . . . .l l"".b b b b l l"".c c c c c."".d d d d d."".e e e e e."".f f g g g."". . . . . . ."}.header{justify-content:flex-start}:host([mode=fullscreen]) .grid,:host([mode=fullscreenTakeover]) .grid{grid-template-columns:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))1fr var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-rows:var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid))auto auto auto 1fr auto var(--mod-dialog-confirm-padding-grid,var(--spectrum-dialog-confirm-padding-grid));grid-template-areas:". . ."".b."".c."".d."".e."".g."". . .";display:grid}:host([mode=fullscreen]) .button-group,:host([mode=fullscreenTakeover]) .button-group{padding-block-start:var(--mod-dialog-confirm-buttongroup-padding-top,var(--spectrum-dialog-confirm-buttongroup-padding-top))}:host([mode=fullscreen]) ::slotted([slot=heading]),:host([mode=fullscreenTakeover]) ::slotted([slot=heading]){font-size:var(--mod-dialog-confirm-title-text-size,var(--spectrum-dialog-confirm-title-text-size))}}@media (forced-colors:active){:host{border:solid}}:host{--swc-alert-dialog-error-icon-color:var(--spectrum-negative-visual-color)}.content{overflow:hidden}.footer{color:var(--spectrum-dialog-confirm-description-text-color,var(--spectrum-gray-800))}.type-icon{color:var(--mod-alert-dialog-error-icon-color,var(--swc-alert-dialog-error-icon-color));grid-area:i}.content[tabindex]{overflow:auto}::slotted(img[slot=hero]){width:100%;height:auto}.grid{grid-template-areas:"a a a a a a"". . . . . ."".b c c i."".d d d d."".e e e e."".f f g g."". . . . . ."}:host([dismissable]) .grid{grid-template-areas:"a a a a a a a"". . . . .l l"".b c c i l l"".d d d d d."".e e e e e."".f f g g g."". . . . . . ."}.button-group.button-group--noFooter{grid-area:f/f/g/g}
`;
var dialog_css_default = o18;

// ../node_modules/@spectrum-web-components/alert-dialog/src/AlertDialog.js
init_src();
init_decorators2();
init_focus_visible();
init_random_id();
init_condition_attribute_with_id();

// ../node_modules/@lit-labs/observers/resize-controller.js
var s12 = class {
  constructor(s14, { target: t16, config: i20, callback: h11, skipInitial: e22 }) {
    this.t = /* @__PURE__ */ new Set(), this.o = false, this.i = false, this.h = s14, null !== t16 && this.t.add(t16 ?? s14), this.l = i20, this.o = e22 ?? this.o, this.callback = h11, window.ResizeObserver ? (this.u = new ResizeObserver((s15) => {
      this.handleChanges(s15), this.h.requestUpdate();
    }), s14.addController(this)) : console.warn("ResizeController error: browser does not support ResizeObserver.");
  }
  handleChanges(s14) {
    this.value = this.callback?.(s14, this.u);
  }
  hostConnected() {
    for (const s14 of this.t) this.observe(s14);
  }
  hostDisconnected() {
    this.disconnect();
  }
  async hostUpdated() {
    !this.o && this.i && this.handleChanges([]), this.i = false;
  }
  observe(s14) {
    this.t.add(s14), this.u.observe(s14, this.l), this.i = true, this.h.requestUpdate();
  }
  unobserve(s14) {
    this.t.delete(s14), this.u.unobserve(s14);
  }
  disconnect() {
    this.u.disconnect();
  }
};

// ../node_modules/@spectrum-web-components/alert-dialog/src/alert-dialog.css.js
init_src();
var e16 = i3`
    :host{--spectrum-alert-dialog-min-width:var(--spectrum-alert-dialog-minimum-width);--spectrum-alert-dialog-max-width:var(--spectrum-alert-dialog-maximum-width);--spectrum-alert-dialog-icon-size:var(--spectrum-workflow-icon-size-100);--spectrum-alert-dialog-warning-icon-color:var(--spectrum-notice-visual-color);--spectrum-alert-dialog-error-icon-color:var(--spectrum-negative-visual-color);--spectrum-alert-dialog-title-font-family:var(--spectrum-sans-font-family-stack);--spectrum-alert-dialog-title-font-weight:var(--spectrum-heading-sans-serif-font-weight);--spectrum-alert-dialog-title-font-style:var(--spectrum-heading-sans-serif-font-style);--spectrum-alert-dialog-title-font-size:var(--spectrum-alert-dialog-title-size);--spectrum-alert-dialog-title-line-height:var(--spectrum-heading-line-height);--spectrum-alert-dialog-title-color:var(--spectrum-heading-color);--spectrum-alert-dialog-body-font-family:var(--spectrum-sans-font-family-stack);--spectrum-alert-dialog-body-font-weight:var(--spectrum-body-sans-serif-font-weight);--spectrum-alert-dialog-body-font-style:var(--spectrum-body-sans-serif-font-style);--spectrum-alert-dialog-body-font-size:var(--spectrum-alert-dialog-description-size);--spectrum-alert-dialog-body-line-height:var(--spectrum-line-height-100);--spectrum-alert-dialog-body-color:var(--spectrum-body-color);--spectrum-alert-dialog-title-to-divider:var(--spectrum-spacing-200);--spectrum-alert-dialog-divider-to-description:var(--spectrum-spacing-300);--spectrum-alert-dialog-title-to-icon:var(--spectrum-spacing-300);--mod-buttongroup-justify-content:flex-end;box-sizing:border-box;min-inline-size:var(--mod-alert-dialog-min-width,var(--spectrum-alert-dialog-min-width));max-inline-size:var(--mod-alert-dialog-max-width,var(--spectrum-alert-dialog-max-width));max-block-size:inherit;padding:var(--mod-alert-dialog-padding,var(--spectrum-alert-dialog-padding));outline:none;inline-size:fit-content;display:flex}.icon{inline-size:var(--mod-alert-dialog-icon-size,var(--spectrum-alert-dialog-icon-size));block-size:var(--mod-alert-dialog-icon-size,var(--spectrum-alert-dialog-icon-size));flex-shrink:0;margin-inline-start:var(--mod-alert-dialog-title-to-icon,var(--spectrum-alert-dialog-title-to-icon))}:host([variant=warning]){--mod-icon-color:var(--mod-alert-dialog-warning-icon-color,var(--spectrum-alert-dialog-warning-icon-color))}:host([variant=error]){--mod-icon-color:var(--mod-alert-dialog-error-icon-color,var(--spectrum-alert-dialog-error-icon-color))}.grid{display:grid}.header{justify-content:space-between;align-items:baseline;display:flex}::slotted([slot=heading]){font-family:var(--mod-alert-dialog-title-font-family,var(--spectrum-alert-dialog-title-font-family));font-weight:var(--mod-alert-dialog-title-font-weight,var(--spectrum-alert-dialog-title-font-weight));font-style:var(--mod-alert-dialog-title-font-style,var(--spectrum-alert-dialog-title-font-style));font-size:var(--mod-alert-dialog-title-font-size,var(--spectrum-alert-dialog-title-font-size));line-height:var(--mod-alert-dialog-title-line-height,var(--spectrum-alert-dialog-title-line-height));color:var(--mod-alert-dialog-title-color,var(--spectrum-alert-dialog-title-color));margin:0;margin-block-end:var(--mod-alert-dialog-title-to-divider,var(--spectrum-alert-dialog-title-to-divider))}.content{font-family:var(--mod-alert-dialog-body-font-family,var(--spectrum-alert-dialog-body-font-family));font-weight:var(--mod-alert-dialog-body-font-weight,var(--spectrum-alert-dialog-body-font-weight));font-style:var(--mod-alert-dialog-body-font-style,var(--spectrum-alert-dialog-body-font-style));font-size:var(--mod-alert-dialog-body-font-size,var(--spectrum-alert-dialog-body-font-size));line-height:var(--mod-alert-dialog-body-line-height,var(--spectrum-alert-dialog-body-line-height));color:var(--mod-alert-dialog-body-color,var(--spectrum-alert-dialog-body-color));-webkit-overflow-scrolling:touch;margin:0;margin-block-start:var(--mod-alert-dialog-divider-to-description,var(--spectrum-alert-dialog-divider-to-description));margin-block-end:var(--mod-alert-dialog-description-to-buttons,var(--spectrum-alert-dialog-description-to-buttons));overflow-y:auto}@media (forced-colors:active){:host{border:solid}}
`;
var alert_dialog_css_default = e16;

// ../node_modules/@spectrum-web-components/alert-dialog/src/AlertDialog.js
var b3 = Object.defineProperty;
var u13 = Object.getOwnPropertyDescriptor;
var l12 = (a10, r16, e22, t16) => {
  for (var i20 = t16 > 1 ? void 0 : t16 ? u13(r16, e22) : r16, n18 = a10.length - 1, d13; n18 >= 0; n18--) (d13 = a10[n18]) && (i20 = (t16 ? d13(r16, e22, i20) : d13(i20)) || i20);
  return t16 && i20 && b3(r16, e22, i20), i20;
};
var alertDialogVariants = ["confirmation", "information", "warning", "error", "destructive", "secondary"];
function h8(a10, r16) {
  const e22 = a10.assignedElements(), t16 = [];
  return e22.forEach((i20) => {
    if (i20.id) t16.push(i20.id);
    else {
      const n18 = r16 + `-${randomID()}`;
      i20.id = n18, t16.push(n18);
    }
  }), t16;
}
var o19 = class o20 extends FocusVisiblePolyfillMixin(SpectrumElement) {
  constructor() {
    super(...arguments);
    this.resizeController = new s12(this, { callback: () => {
      this.shouldManageTabOrderForScrolling();
    } });
    this._variant = "";
    this.labelledbyId = `sp-dialog-label-${o20.instanceCount++}`;
    this.shouldManageTabOrderForScrolling = () => {
      if (!this.contentElement) return;
      const { offsetHeight: e22, scrollHeight: t16 } = this.contentElement;
      e22 < t16 ? this.contentElement.tabIndex = 0 : this.contentElement.removeAttribute("tabindex");
    };
    this.describedbyId = `sp-dialog-description-${o20.instanceCount++}`;
  }
  static get styles() {
    return [alert_dialog_css_default];
  }
  set variant(e22) {
    if (e22 === this.variant) return;
    const t16 = this.variant;
    alertDialogVariants.includes(e22) ? (this.setAttribute("variant", e22), this._variant = e22) : (this.removeAttribute("variant"), this._variant = ""), this.requestUpdate("variant", t16);
  }
  get variant() {
    return this._variant;
  }
  renderIcon() {
    switch (this.variant) {
      case "warning":
      case "error":
        return x`
                    <sp-icon-alert class="icon"></sp-icon-alert>
                `;
      default:
        return x``;
    }
  }
  renderHeading() {
    return x`
            <slot name="heading" @slotchange=${this.onHeadingSlotchange}></slot>
        `;
  }
  renderContent() {
    return x`
            <div class="content">
                <slot @slotchange=${this.onContentSlotChange}></slot>
            </div>
        `;
  }
  onHeadingSlotchange({ target: e22 }) {
    this.conditionLabelledby && (this.conditionLabelledby(), delete this.conditionLabelledby);
    const t16 = h8(e22, this.labelledbyId);
    t16.length && (this.conditionLabelledby = conditionAttributeWithId(this, "aria-labelledby", t16));
  }
  onContentSlotChange({ target: e22 }) {
    requestAnimationFrame(() => {
      this.resizeController.unobserve(this.contentElement), this.resizeController.observe(this.contentElement);
    }), this.conditionDescribedby && (this.conditionDescribedby(), delete this.conditionDescribedby);
    const t16 = h8(e22, this.describedbyId);
    if (t16.length && t16.length < 4) this.conditionDescribedby = conditionAttributeWithId(this, "aria-describedby", t16);
    else if (!t16.length) {
      const i20 = !!this.id;
      i20 || (this.id = this.describedbyId);
      const n18 = conditionAttributeWithId(this, "aria-describedby", this.id);
      this.conditionDescribedby = () => {
        n18(), i20 || this.removeAttribute("id");
      };
    }
  }
  renderButtons() {
    return x`
            <sp-button-group class="button-group">
                <slot name="button"></slot>
            </sp-button-group>
        `;
  }
  render() {
    return x`
            <div class="grid">
                <div class="header">
                    ${this.renderHeading()} ${this.renderIcon()}
                </div>
                <sp-divider size="m" class="divider"></sp-divider>
                ${this.renderContent()} ${this.renderButtons()}
            </div>
        `;
  }
};
o19.instanceCount = 0, l12([i5(".content")], o19.prototype, "contentElement", 2), l12([n7({ type: String, reflect: true })], o19.prototype, "variant", 1);
var AlertDialog = o19;

// ../node_modules/@spectrum-web-components/dialog/src/Dialog.js
init_directives();
var a8 = Object.defineProperty;
var c12 = Object.getOwnPropertyDescriptor;
var t11 = (u14, i20, e22, n18) => {
  for (var r16 = n18 > 1 ? void 0 : n18 ? c12(i20, e22) : i20, p18 = u14.length - 1, d13; p18 >= 0; p18--) (d13 = u14[p18]) && (r16 = (n18 ? d13(i20, e22, r16) : d13(r16)) || r16);
  return n18 && r16 && a8(i20, e22, r16), r16;
};
var Dialog = class extends ObserveSlotPresence(AlertDialog, ['[slot="hero"]', '[slot="footer"]', '[slot="button"]']) {
  constructor() {
    super(...arguments);
    this.error = false;
    this.dismissable = false;
    this.dismissLabel = "Close";
    this.noDivider = false;
  }
  static get styles() {
    return [dialog_css_default];
  }
  get hasFooter() {
    return this.getSlotContentPresence('[slot="footer"]');
  }
  get hasButtons() {
    return this.getSlotContentPresence('[slot="button"]');
  }
  get hasHero() {
    return this.getSlotContentPresence('[slot="hero"]');
  }
  close() {
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true, cancelable: true }));
  }
  renderHero() {
    return x`
            <slot name="hero"></slot>
        `;
  }
  renderFooter() {
    return x`
            <div class="footer">
                <slot name="footer"></slot>
            </div>
        `;
  }
  renderButtons() {
    const e22 = { "button-group": true, "button-group--noFooter": !this.hasFooter };
    return x`
            <sp-button-group class=${o9(e22)}>
                <slot name="button"></slot>
            </sp-button-group>
        `;
  }
  renderDismiss() {
    return x`
            <sp-close-button
                class="close-button"
                label=${this.dismissLabel}
                quiet
                size="m"
                @click=${this.close}
            ></sp-close-button>
        `;
  }
  render() {
    return x`
            <div class="grid">
                ${this.renderHero()} ${this.renderHeading()}
                ${this.error ? x`
                          <sp-icon-alert class="type-icon"></sp-icon-alert>
                      ` : A}
                ${this.noDivider ? A : x`
                          <sp-divider size="m" class="divider"></sp-divider>
                      `}
                ${this.renderContent()}
                ${this.hasFooter ? this.renderFooter() : A}
                ${this.hasButtons ? this.renderButtons() : A}
                ${this.dismissable ? this.renderDismiss() : A}
            </div>
        `;
  }
  shouldUpdate(e22) {
    return e22.has("mode") && this.mode && (this.dismissable = false), e22.has("dismissable") && this.dismissable && (this.dismissable = !this.mode), super.shouldUpdate(e22);
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.setAttribute("role", "dialog");
  }
};
t11([i5(".close-button")], Dialog.prototype, "closeButton", 2), t11([n7({ type: Boolean, reflect: true })], Dialog.prototype, "error", 2), t11([n7({ type: Boolean, reflect: true })], Dialog.prototype, "dismissable", 2), t11([n7({ type: String, reflect: true, attribute: "dismiss-label" })], Dialog.prototype, "dismissLabel", 2), t11([n7({ type: Boolean, reflect: true, attribute: "no-divider" })], Dialog.prototype, "noDivider", 2), t11([n7({ type: String, reflect: true })], Dialog.prototype, "mode", 2), t11([n7({ type: String, reflect: true })], Dialog.prototype, "size", 2);

// ../node_modules/@spectrum-web-components/dialog/sp-dialog.js
init_define_element();
defineElement("sp-dialog", Dialog);

// ../node_modules/@spectrum-web-components/menu/src/MenuDivider.js
init_src();

// ../node_modules/@spectrum-web-components/menu/src/menu-divider.css.js
init_src();
var i16 = i3`
    :host{--spectrum-menu-divider-thickness:var(--spectrum-divider-thickness-medium);margin-block:var(--mod-menu-section-divider-margin-block,max(0px,( var(--spectrum-menu-item-section-divider-height) - var(--spectrum-menu-divider-thickness))/2));margin-inline:var(--mod-menu-item-label-inline-edge-to-content,var(--spectrum-menu-item-label-inline-edge-to-content));inline-size:auto;overflow:visible}.spectrum-Menu-back:focus-visible{box-shadow:inset calc(var(--mod-menu-item-focus-indicator-width,var(--spectrum-menu-item-focus-indicator-width))*var(--spectrum-menu-item-focus-indicator-direction-scalar,1))0 0 0 var(--highcontrast-menu-item-focus-indicator-color,var(--mod-menu-item-focus-indicator-color,var(--spectrum-menu-item-focus-indicator-color)))}.spectrum-Menu-back{padding-inline:var(--mod-menu-back-padding-inline-start,0)var(--mod-menu-back-padding-inline-end,var(--spectrum-menu-item-label-inline-edge-to-content));padding-block:var(--mod-menu-back-padding-block-start,0)var(--mod-menu-back-padding-block-end,0);flex-flow:wrap;align-items:center;display:flex}.spectrum-Menu-backButton{cursor:pointer;background:0 0;border:0;margin:0;padding:0;display:inline-flex}.spectrum-Menu-backButton:focus-visible{outline:var(--spectrum-focus-indicator-thickness)solid var(--spectrum-focus-indicator-color);outline-offset:calc((var(--spectrum-focus-indicator-thickness) + 1px)*-1)}.spectrum-Menu-backHeading{color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-heading-color,var(--spectrum-menu-section-header-color)));font-size:var(--mod-menu-section-header-font-size,var(--spectrum-menu-section-header-font-size));font-weight:var(--mod-menu-section-header-font-weight,var(--spectrum-menu-section-header-font-weight));line-height:var(--mod-menu-section-header-line-height,var(--spectrum-menu-section-header-line-height));display:block}.spectrum-Menu-backIcon{margin-block:var(--mod-menu-back-icon-margin-block,var(--spectrum-menu-back-icon-margin));margin-inline:var(--mod-menu-back-icon-margin-inline,var(--spectrum-menu-back-icon-margin));fill:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default))}:host{flex-shrink:0;display:block}
`;
var menu_divider_css_default = i16;

// ../node_modules/@spectrum-web-components/menu/src/MenuDivider.js
var MenuDivider = class extends SizedMixin(SpectrumElement, { validSizes: ["s", "m", "l"] }) {
  static get styles() {
    return [divider_css_default, menu_divider_css_default];
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.setAttribute("role", "separator");
  }
};

// ../node_modules/@spectrum-web-components/menu/sp-menu-divider.js
init_define_element();
defineElement("sp-menu-divider", MenuDivider);

// ../node_modules/@spectrum-web-components/menu/src/MenuItem.js
init_src();
init_src2();
init_decorators2();

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCheckmark100.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Checkmark100.js
var Checkmark100Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Checkmark100" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="M3.5 9.5a1 1 0 0 1-.774-.368l-2.45-3a1 1 0 1 1 1.548-1.264l1.657 2.028 4.68-6.01A1 1 0 0 1 9.74 2.114l-5.45 7a1 1 0 0 1-.777.386z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconCheckmark100.js
var IconCheckmark100 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Checkmark100Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-checkmark100.js
init_define_element();
defineElement("sp-icon-checkmark100", IconCheckmark100);

// ../node_modules/@spectrum-web-components/menu/src/MenuItem.js
init_like_anchor();
init_focusable();

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconChevron100.js
init_src();

// ../node_modules/@spectrum-web-components/icons-ui/src/icons/Chevron100.js
var Chevron100Icon = ({ width: t16 = 24, height: e22 = 24, title: r16 = "Chevron100" } = {}) => tag`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 10"
    aria-hidden="true"
    role="img"
    fill="currentColor"
    aria-label=${r16}
    width=${t16}
    height=${e22}
  >
    <path
      d="M3 9.95a.875.875 0 0 1-.615-1.498L5.88 5 2.385 1.547A.875.875 0 0 1 3.615.302L7.74 4.377a.876.876 0 0 1 0 1.246L3.615 9.698A.87.87 0 0 1 3 9.95"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-ui/src/elements/IconChevron100.js
var IconChevron100 = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag(x), Chevron100Icon();
  }
};

// ../node_modules/@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js
init_define_element();
defineElement("sp-icon-chevron100", IconChevron100);

// ../node_modules/@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js
init_src();
var r9 = i3`
    .spectrum-UIIcon-ChevronRight50{--spectrum-icon-size:var(--spectrum-chevron-icon-size-50)}.spectrum-UIIcon-ChevronRight75{--spectrum-icon-size:var(--spectrum-chevron-icon-size-75)}.spectrum-UIIcon-ChevronRight100{--spectrum-icon-size:var(--spectrum-chevron-icon-size-100)}.spectrum-UIIcon-ChevronRight200{--spectrum-icon-size:var(--spectrum-chevron-icon-size-200)}.spectrum-UIIcon-ChevronRight300{--spectrum-icon-size:var(--spectrum-chevron-icon-size-300)}.spectrum-UIIcon-ChevronRight400{--spectrum-icon-size:var(--spectrum-chevron-icon-size-400)}.spectrum-UIIcon-ChevronRight500{--spectrum-icon-size:var(--spectrum-chevron-icon-size-500)}.spectrum-UIIcon-ChevronDown50{--spectrum-icon-size:var(--spectrum-chevron-icon-size-50);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown75{--spectrum-icon-size:var(--spectrum-chevron-icon-size-75);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown100{--spectrum-icon-size:var(--spectrum-chevron-icon-size-100);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown200{--spectrum-icon-size:var(--spectrum-chevron-icon-size-200);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown300{--spectrum-icon-size:var(--spectrum-chevron-icon-size-300);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown400{--spectrum-icon-size:var(--spectrum-chevron-icon-size-400);transform:rotate(90deg)}.spectrum-UIIcon-ChevronDown500{--spectrum-icon-size:var(--spectrum-chevron-icon-size-500);transform:rotate(90deg)}.spectrum-UIIcon-ChevronLeft50{--spectrum-icon-size:var(--spectrum-chevron-icon-size-50);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft75{--spectrum-icon-size:var(--spectrum-chevron-icon-size-75);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft100{--spectrum-icon-size:var(--spectrum-chevron-icon-size-100);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft200{--spectrum-icon-size:var(--spectrum-chevron-icon-size-200);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft300{--spectrum-icon-size:var(--spectrum-chevron-icon-size-300);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft400{--spectrum-icon-size:var(--spectrum-chevron-icon-size-400);transform:rotate(180deg)}.spectrum-UIIcon-ChevronLeft500{--spectrum-icon-size:var(--spectrum-chevron-icon-size-500);transform:rotate(180deg)}.spectrum-UIIcon-ChevronUp50{--spectrum-icon-size:var(--spectrum-chevron-icon-size-50);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp75{--spectrum-icon-size:var(--spectrum-chevron-icon-size-75);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp100{--spectrum-icon-size:var(--spectrum-chevron-icon-size-100);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp200{--spectrum-icon-size:var(--spectrum-chevron-icon-size-200);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp300{--spectrum-icon-size:var(--spectrum-chevron-icon-size-300);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp400{--spectrum-icon-size:var(--spectrum-chevron-icon-size-400);transform:rotate(270deg)}.spectrum-UIIcon-ChevronUp500{--spectrum-icon-size:var(--spectrum-chevron-icon-size-500);transform:rotate(270deg)}
`;
var spectrum_icon_chevron_css_default = r9;

// ../node_modules/@spectrum-web-components/reactive-controllers/src/DependencyManger.js
var dependencyManagerLoadedSymbol = Symbol("dependency manager loaded");
var DependencyManagerController = class {
  constructor(e22) {
    this.dependencies = {};
    this._loaded = false;
    this.host = e22;
  }
  get loaded() {
    return this._loaded;
  }
  set loaded(e22) {
    e22 !== this.loaded && (this._loaded = e22, this.host.requestUpdate(dependencyManagerLoadedSymbol, !this.loaded));
  }
  add(e22, o26) {
    const t16 = !!o26 || !!customElements.get(e22) || this.dependencies[e22];
    t16 || customElements.whenDefined(e22).then(() => {
      this.add(e22, true);
    }), this.dependencies = { ...this.dependencies, [e22]: t16 }, this.loaded = Object.values(this.dependencies).every((d13) => d13);
  }
};

// ../node_modules/@spectrum-web-components/menu/src/menu-item.css.js
init_src();
var o21 = i3`
    .checkmark{block-size:var(--mod-menu-item-checkmark-height,var(--spectrum-menu-item-checkmark-height));inline-size:var(--mod-menu-item-checkmark-width,var(--spectrum-menu-item-checkmark-width));grid-area:e;align-self:start;margin-block-start:calc(var(--mod-menu-item-top-to-checkmark,var(--spectrum-menu-item-top-to-checkmark)) - var(--mod-menu-item-top-edge-to-text,var(--spectrum-menu-item-top-edge-to-text)));margin-inline-end:var(--mod-menu-item-text-to-control,var(--spectrum-menu-item-text-to-control))}.spectrum-Menu-back:focus-visible{box-shadow:inset calc(var(--mod-menu-item-focus-indicator-width,var(--spectrum-menu-item-focus-indicator-width))*var(--spectrum-menu-item-focus-indicator-direction-scalar,1))0 0 0 var(--highcontrast-menu-item-focus-indicator-color,var(--mod-menu-item-focus-indicator-color,var(--spectrum-menu-item-focus-indicator-color)))}.chevron{block-size:var(--spectrum-menu-item-checkmark-height);inline-size:var(--spectrum-menu-item-checkmark-width);grid-area:o;align-self:center;margin-inline-end:var(--mod-menu-item-text-to-control,var(--spectrum-menu-item-text-to-control))}.spectrum-Menu-backButton:focus-visible{outline:var(--spectrum-focus-indicator-thickness)solid var(--spectrum-focus-indicator-color);outline-offset:calc((var(--spectrum-focus-indicator-thickness) + 1px)*-1)}::slotted([slot=icon]){fill:var(--highcontrast-menu-item-color-default,var(--mod-menu-item-label-icon-color-default,var(--spectrum-menu-item-label-icon-color-default)));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-item-label-icon-color-default,var(--spectrum-menu-item-label-icon-color-default)))}.checkmark{display:var(--mod-menu-checkmark-display,var(--spectrum-menu-checkmark-display));fill:var(--highcontrast-menu-checkmark-icon-color-default,var(--mod-menu-checkmark-icon-color-default,var(--spectrum-menu-checkmark-icon-color-default)));color:var(--highcontrast-menu-checkmark-icon-color-default,var(--mod-menu-checkmark-icon-color-default,var(--spectrum-menu-checkmark-icon-color-default)));opacity:1;align-self:center}:host{cursor:pointer;box-sizing:border-box;background-color:var(--highcontrast-menu-item-background-color-default,var(--mod-menu-item-background-color-default,var(--spectrum-menu-item-background-color-default)));line-height:var(--mod-menu-item-label-line-height,var(--spectrum-menu-item-label-line-height));min-block-size:var(--mod-menu-item-min-height,var(--spectrum-menu-item-min-height));padding-block-start:var(--mod-menu-item-top-edge-to-text,var(--spectrum-menu-item-top-edge-to-text));padding-block-end:var(--mod-menu-item-bottom-edge-to-text,var(--spectrum-menu-item-bottom-edge-to-text));padding-inline:var(--mod-menu-item-label-inline-edge-to-content,var(--spectrum-menu-item-label-inline-edge-to-content));align-items:center;margin:0;-webkit-text-decoration:none;text-decoration:none;position:relative}.spectrum-Menu-itemCheckbox{--mod-checkbox-top-to-text:0;--mod-checkbox-text-to-control:0;min-block-size:0}.spectrum-Menu-itemCheckbox .spectrum-Checkbox-box{margin-block-start:var(--mod-menu-item-top-to-checkbox,var(--spectrum-menu-item-top-to-checkbox));margin-block-end:0;margin-inline-end:var(--mod-menu-item-text-to-control,var(--spectrum-menu-item-text-to-control))}.spectrum-Menu-itemSwitch{min-block-size:0}.spectrum-Menu-itemSwitch .spectrum-Switch-switch{margin-block-start:var(--mod-menu-item-top-to-action,var(--spectrum-menu-item-top-to-action));margin-block-end:0}:host{grid-template:".a.b c. . ."1fr"d a e f g h i j"". . . .k. . ."". . . .l. . ."/auto auto auto auto 1fr auto auto auto;display:grid}#label{grid-area:m}:host([focused]),:host(:focus){background-color:var(--highcontrast-menu-item-background-color-focus,var(--mod-menu-item-background-color-key-focus,var(--spectrum-menu-item-background-color-key-focus)));outline:none}:host([focused])>#label,:host(:focus)>#label{color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-content-color-focus,var(--spectrum-menu-item-label-content-color-focus)))}:host([focused])>[name=description]::slotted(*),:host(:focus)>[name=description]::slotted(*){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-description-color-focus,var(--spectrum-menu-item-description-color-focus)))}:host([focused])>::slotted([slot=value]),:host(:focus)>::slotted([slot=value]){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-value-color-focus,var(--spectrum-menu-item-value-color-focus)))}:host([focused])>.icon:not(.chevron,.checkmark),:host(:focus)>.icon:not(.chevron,.checkmark){fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-focus,var(--spectrum-menu-item-label-icon-color-focus)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-focus,var(--spectrum-menu-item-label-icon-color-focus)))}:host([focused])>.chevron,:host(:focus)>.chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)))}:host([focused])>.checkmark,:host(:focus)>.checkmark{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-focus,var(--spectrum-menu-checkmark-icon-color-focus)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-focus,var(--spectrum-menu-checkmark-icon-color-focus)))}:host([focused]) .spectrum-Menu-back,:host([focused]){box-shadow:inset calc(var(--mod-menu-item-focus-indicator-width,var(--spectrum-menu-item-focus-indicator-width))*var(--spectrum-menu-item-focus-indicator-direction-scalar,1))0 0 0 var(--highcontrast-menu-item-focus-indicator-color,var(--mod-menu-item-focus-indicator-color,var(--spectrum-menu-item-focus-indicator-color)))}:host:dir(rtl),:host([dir=rtl]){--spectrum-menu-item-focus-indicator-direction-scalar:-1}:host(:is(:active,[active])){background-color:var(--highcontrast-menu-item-background-color-focus,var(--mod-menu-item-background-color-down,var(--spectrum-menu-item-background-color-down)))}:host(:is(:active,[active]))>#label{color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-content-color-down,var(--spectrum-menu-item-label-content-color-down)))}:host(:is(:active,[active]))>[name=description]::slotted(*){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-description-color-down,var(--spectrum-menu-item-description-color-down)))}:host(:is(:active,[active]))>::slotted([slot=value]){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-value-color-down,var(--spectrum-menu-item-value-color-down)))}:host(:is(:active,[active]))>.icon:not(.chevron,.checkmark){fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-down,var(--spectrum-menu-item-label-icon-color-down)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-down,var(--spectrum-menu-item-label-icon-color-down)))}:host(:is(:active,[active]))>.chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)))}:host(:is(:active,[active]))>.checkmark{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-down,var(--spectrum-menu-checkmark-icon-color-down)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-down,var(--spectrum-menu-checkmark-icon-color-down)))}::slotted([slot=icon]){grid-area:f;align-self:start}.spectrum-Menu-item--collapsible ::slotted([slot=icon]){grid-area:b}:host .is-selectableMultiple{align-items:start}.is-selectableMultiple .spectrum-Menu-itemCheckbox{grid-area:e}.checkmark{grid-area:e;align-self:start}.spectrum-Menu-itemSelection{grid-area:d}#label{font-size:var(--mod-menu-item-label-font-size,var(--spectrum-menu-item-label-font-size));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-item-label-content-color-default,var(--spectrum-menu-item-label-content-color-default)));grid-area:g}::slotted([slot=value]){grid-area:h}.spectrum-Menu-itemActions{grid-area:i;align-self:start;margin-inline-start:var(--mod-menu-item-label-to-value-area-min-spacing,var(--spectrum-menu-item-label-to-value-area-min-spacing))}.chevron{block-size:var(--spectrum-menu-item-checkmark-height);inline-size:var(--spectrum-menu-item-checkmark-width);grid-area:o;align-self:center}.spectrum-Menu-item--collapsible .chevron{grid-area:a}[name=description]::slotted(*){grid-area:k}:host([has-submenu]) .chevron{grid-area:j}.icon:not(.chevron,.checkmark){block-size:var(--mod-menu-item-icon-height,var(--spectrum-menu-item-icon-height));inline-size:var(--mod-menu-item-icon-width,var(--spectrum-menu-item-icon-width))}.checkmark{block-size:var(--mod-menu-item-checkmark-height,var(--spectrum-menu-item-checkmark-height));inline-size:var(--mod-menu-item-checkmark-width,var(--spectrum-menu-item-checkmark-width));margin-block-start:calc(var(--mod-menu-item-top-to-checkmark,var(--spectrum-menu-item-top-to-checkmark)) - var(--mod-menu-item-top-edge-to-text,var(--spectrum-menu-item-top-edge-to-text)));margin-inline-end:var(--mod-menu-item-text-to-control,var(--spectrum-menu-item-text-to-control))}::slotted([slot=icon]){margin-inline-end:var(--mod-menu-item-label-text-to-visual,var(--spectrum-menu-item-label-text-to-visual))}.chevron{margin-inline-end:var(--mod-menu-item-text-to-control,var(--spectrum-menu-item-text-to-control))}[name=description]::slotted(*){color:var(--highcontrast-menu-item-color-default,var(--mod-menu-item-description-color-default,var(--spectrum-menu-item-description-color-default)));font-size:var(--mod-menu-item-description-font-size,var(--spectrum-menu-item-description-font-size));line-height:var(--mod-menu-item-description-line-height,var(--spectrum-menu-item-description-line-height));margin-block-start:var(--mod-menu-item-label-to-description-spacing,var(--spectrum-menu-item-label-to-description-spacing))}[name=description]::slotted(*),#label{hyphens:auto;overflow-wrap:break-word}::slotted([slot=value]){color:var(--highcontrast-menu-item-color-default,var(--mod-menu-item-value-color-default,var(--spectrum-menu-item-value-color-default)));font-size:var(--mod-menu-item-label-font-size,var(--spectrum-menu-item-label-font-size));place-self:start end;margin-inline-start:var(--mod-menu-item-label-to-value-area-min-spacing,var(--spectrum-menu-item-label-to-value-area-min-spacing))}:host([no-wrap]) #label{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.spectrum-Menu-item--collapsible.is-open{padding-block-end:0}.spectrum-Menu-item--collapsible.is-open .chevron{transform:rotate(90deg)}:host([focused]) .spectrum-Menu-item--collapsible.is-open,:host(:is(:active,[active])) .spectrum-Menu-item--collapsible.is-open,.spectrum-Menu-item--collapsible.is-open:focus{background-color:var(--highcontrast-menu-item-background-color-default,var(--mod-menu-item-background-color-default,var(--spectrum-menu-item-background-color-default)))}.spectrum-Menu-item--collapsible>::slotted([slot=icon]){padding-block-start:var(--mod-menu-section-header-top-edge-to-text,var(--mod-menu-item-top-edge-to-text,var(--spectrum-menu-item-top-edge-to-text)));padding-block-end:var(--mod-menu-section-header-bottom-edge-to-text,var(--mod-menu-item-bottom-edge-to-text,var(--spectrum-menu-item-bottom-edge-to-text)))}.chevron:dir(rtl),:host([dir=rtl]) .chevron{transform:rotate(-180deg)}:host([has-submenu]) .chevron{fill:var(--highcontrast-menu-item-color-default,var(--mod-menu-drillin-icon-color-default,var(--spectrum-menu-drillin-icon-color-default)));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-drillin-icon-color-default,var(--spectrum-menu-drillin-icon-color-default)));margin-inline-start:var(--mod-menu-item-label-to-value-area-min-spacing,var(--spectrum-menu-item-label-to-value-area-min-spacing));margin-inline-end:0}:host([has-submenu]) .is-open{--spectrum-menu-item-background-color-default:var(--highcontrast-menu-item-selected-background-color,var(--mod-menu-item-background-color-hover,var(--spectrum-menu-item-background-color-hover)))}:host([has-submenu]) .is-open .icon:not(.chevron,.checkmark){fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-hover,var(--spectrum-menu-item-label-icon-color-hover)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-hover,var(--spectrum-menu-item-label-icon-color-hover)))}:host([has-submenu]) .is-open .chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-hover,var(--spectrum-menu-drillin-icon-color-hover)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-hover,var(--spectrum-menu-drillin-icon-color-hover)))}:host([has-submenu]) .is-open .checkmark{fill:var(--highcontrast-menu-checkmark-icon-color-default,var(--mod-menu-checkmark-icon-color-hover,var(--spectrum-menu-checkmark-icon-color-hover)));color:var(--highcontrast-menu-checkmark-icon-color-default,var(--mod-menu-checkmark-icon-color-hover,var(--spectrum-menu-checkmark-icon-color-hover)))}:host([has-submenu][focused]) .chevron,:host([has-submenu]:focus) .chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-focus,var(--spectrum-menu-drillin-icon-color-focus)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-focus,var(--spectrum-menu-drillin-icon-color-focus)))}:host([has-submenu]:is(:active,[active])) .chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-down,var(--spectrum-menu-drillin-icon-color-down)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-down,var(--spectrum-menu-drillin-icon-color-down)))}:host([disabled]),:host([aria-disabled=true]){background-color:initial}:host([disabled]) #label,:host([disabled]) ::slotted([slot=value]),:host([aria-disabled=true]) #label,:host([aria-disabled=true]) ::slotted([slot=value]){color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-content-color-disabled,var(--spectrum-menu-item-label-content-color-disabled)))}:host([disabled]) [name=description]::slotted(*),:host([aria-disabled=true]) [name=description]::slotted(*){color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-description-color-disabled,var(--spectrum-menu-item-description-color-disabled)))}:host([disabled]) ::slotted([slot=icon]),:host([aria-disabled=true]) ::slotted([slot=icon]){fill:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-icon-color-disabled,var(--spectrum-menu-item-label-icon-color-disabled)));color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-icon-color-disabled,var(--spectrum-menu-item-label-icon-color-disabled)))}@media (hover:hover){:host(:hover){background-color:var(--highcontrast-menu-item-background-color-focus,var(--mod-menu-item-background-color-hover,var(--spectrum-menu-item-background-color-hover)))}:host(:hover)>#label{color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-content-color-hover,var(--spectrum-menu-item-label-content-color-hover)))}:host(:hover)>[name=description]::slotted(*){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-description-color-hover,var(--spectrum-menu-item-description-color-hover)))}:host(:hover)>::slotted([slot=value]){color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-value-color-hover,var(--spectrum-menu-item-value-color-hover)))}:host(:hover)>.icon:not(.chevron,.checkmark){fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-hover,var(--spectrum-menu-item-label-icon-color-hover)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-item-label-icon-color-hover,var(--spectrum-menu-item-label-icon-color-hover)))}:host(:hover)>.chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-collapsible-icon-color,var(--spectrum-menu-collapsible-icon-color)))}:host(:hover)>.checkmark{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-hover,var(--spectrum-menu-checkmark-icon-color-hover)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-checkmark-icon-color-hover,var(--spectrum-menu-checkmark-icon-color-hover)))}.spectrum-Menu-item--collapsible.is-open:hover{background-color:var(--highcontrast-menu-item-background-color-default,var(--mod-menu-item-background-color-default,var(--spectrum-menu-item-background-color-default)))}:host([has-submenu]:hover) .chevron{fill:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-hover,var(--spectrum-menu-drillin-icon-color-hover)));color:var(--highcontrast-menu-item-color-focus,var(--mod-menu-drillin-icon-color-hover,var(--spectrum-menu-drillin-icon-color-hover)))}:host([disabled]:hover),:host([aria-disabled=true]:hover){cursor:default;background-color:initial}:host([disabled]:hover) #label,:host([disabled]:hover) ::slotted([slot=value]),:host([aria-disabled=true]:hover) #label,:host([aria-disabled=true]:hover) ::slotted([slot=value]){color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-content-color-disabled,var(--spectrum-menu-item-label-content-color-disabled)))}:host([disabled]:hover) [name=description]::slotted(*),:host([aria-disabled=true]:hover) [name=description]::slotted(*){color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-description-color-disabled,var(--spectrum-menu-item-description-color-disabled)))}:host([disabled]:hover) ::slotted([slot=icon]),:host([aria-disabled=true]:hover) ::slotted([slot=icon]){fill:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-icon-color-disabled,var(--spectrum-menu-item-label-icon-color-disabled)));color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-icon-color-disabled,var(--spectrum-menu-item-label-icon-color-disabled)))}}.spectrum-Menu-back{padding-inline:var(--mod-menu-back-padding-inline-start,0)var(--mod-menu-back-padding-inline-end,var(--spectrum-menu-item-label-inline-edge-to-content));padding-block:var(--mod-menu-back-padding-block-start,0)var(--mod-menu-back-padding-block-end,0);flex-flow:wrap;align-items:center;display:flex}.spectrum-Menu-backButton{cursor:pointer;background:0 0;border:0;margin:0;padding:0;display:inline-flex}:host([focused]) .spectrum-Menu-backButton{outline:var(--spectrum-focus-indicator-thickness)solid var(--spectrum-focus-indicator-color);outline-offset:calc((var(--spectrum-focus-indicator-thickness) + 1px)*-1)}.spectrum-Menu-backHeading{color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-heading-color,var(--spectrum-menu-section-header-color)));font-size:var(--mod-menu-section-header-font-size,var(--spectrum-menu-section-header-font-size));font-weight:var(--mod-menu-section-header-font-weight,var(--spectrum-menu-section-header-font-weight));line-height:var(--mod-menu-section-header-line-height,var(--spectrum-menu-section-header-line-height));display:block}.spectrum-Menu-backIcon{margin-block:var(--mod-menu-back-icon-margin-block,var(--spectrum-menu-back-icon-margin));margin-inline:var(--mod-menu-back-icon-margin-inline,var(--spectrum-menu-back-icon-margin));fill:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default))}:host([hidden]){display:none}:host([disabled]){pointer-events:none}:host([disabled]) [name=value]::slotted(*),:host([has-submenu][disabled]) .chevron{color:var(--highcontrast-menu-item-color-disabled,var(--mod-menu-item-label-icon-color-disabled,var(--spectrum-menu-item-label-icon-color-disabled)))}#button{position:absolute;inset:0}:host([dir=ltr]) [icon-only]::slotted(:last-of-type){margin-right:auto}:host([dir=rtl]) [icon-only]::slotted(:last-of-type){margin-left:auto}@media (forced-colors:active){:host{forced-color-adjust:none}}::slotted([slot=submenu]){width:max-content;max-width:100%}:host([no-wrap]) #label{display:block}
`;
var menu_item_css_default = o21;

// ../node_modules/@spectrum-web-components/icon/src/spectrum-icon-checkmark.css.js
init_src();
var e17 = i3`
    .spectrum-UIIcon-Checkmark50{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-50)}.spectrum-UIIcon-Checkmark75{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-75)}.spectrum-UIIcon-Checkmark100{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-100)}.spectrum-UIIcon-Checkmark200{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-200)}.spectrum-UIIcon-Checkmark300{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-300)}.spectrum-UIIcon-Checkmark400{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-400)}.spectrum-UIIcon-Checkmark500{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-500)}.spectrum-UIIcon-Checkmark600{--spectrum-icon-size:var(--spectrum-checkmark-icon-size-600)}
`;
var spectrum_icon_checkmark_css_default = e17;

// ../node_modules/@spectrum-web-components/menu/src/MenuItem.js
init_mutation_controller();
init_slottable_request_event();
var h10 = Object.defineProperty;
var p13 = Object.getOwnPropertyDescriptor;
var r11 = (a10, s14, e22, t16) => {
  for (var n18 = t16 > 1 ? void 0 : t16 ? p13(s14, e22) : s14, i20 = a10.length - 1, d13; i20 >= 0; i20--) (d13 = a10[i20]) && (n18 = (t16 ? d13(s14, e22, n18) : d13(n18)) || n18);
  return t16 && n18 && h10(s14, e22, n18), n18;
};
var L2 = 100;
var MenuItemAddedOrUpdatedEvent = class extends Event {
  constructor(e22) {
    super("sp-menu-item-added-or-updated", { bubbles: true, composed: true });
    this.menuCascade = /* @__PURE__ */ new WeakMap();
    this.clear(e22);
  }
  clear(e22) {
    this._item = e22, this.currentAncestorWithSelects = void 0, e22.menuData = { cleanupSteps: [], focusRoot: void 0, selectionRoot: void 0, parentMenu: void 0 }, this.menuCascade = /* @__PURE__ */ new WeakMap();
  }
  get item() {
    return this._item;
  }
};
var MenuItem = class extends LikeAnchor(ObserveSlotText(ObserveSlotPresence(Focusable, '[slot="icon"]'))) {
  constructor() {
    super();
    this.active = false;
    this.dependencyManager = new DependencyManagerController(this);
    this.focused = false;
    this.selected = false;
    this._value = "";
    this.hasSubmenu = false;
    this.noWrap = false;
    this.open = false;
    this.handleSlottableRequest = (e22) => {
      var t16;
      (t16 = this.submenuElement) == null || t16.dispatchEvent(new SlottableRequestEvent(e22.name, e22.data));
    };
    this.proxyFocus = () => {
      this.focus();
    };
    this.handleBeforetoggle = (e22) => {
      e22.newState === "closed" && (this.open = true, this.overlayElement.manuallyKeepOpen(), this.overlayElement.removeEventListener("beforetoggle", this.handleBeforetoggle));
    };
    this.recentlyLeftChild = false;
    this.willDispatchUpdate = false;
    this.menuData = { focusRoot: void 0, parentMenu: void 0, selectionRoot: void 0, cleanupSteps: [] };
    this.addEventListener("click", this.handleClickCapture, { capture: true }), new t6(this, { config: { characterData: true, childList: true, subtree: true }, callback: (e22) => {
      e22.every((n18) => n18.target.slot === "submenu") || this.breakItemChildrenCache();
    } });
  }
  static get styles() {
    return [menu_item_css_default, spectrum_icon_checkmark_css_default, spectrum_icon_chevron_css_default];
  }
  get value() {
    return this._value || this.itemText;
  }
  set value(e22) {
    e22 !== this._value && (this._value = e22 || "", this._value ? this.setAttribute("value", this._value) : this.removeAttribute("value"));
  }
  get itemText() {
    return this.itemChildren.content.reduce((e22, t16) => e22 + (t16.textContent || "").trim(), "");
  }
  get focusElement() {
    return this;
  }
  get hasIcon() {
    return this.slotContentIsPresent;
  }
  get itemChildren() {
    if (!this.iconSlot || !this.contentSlot) return { icon: [], content: [] };
    if (this._itemChildren) return this._itemChildren;
    const e22 = this.iconSlot.assignedElements().map((n18) => {
      const i20 = n18.cloneNode(true);
      return i20.removeAttribute("slot"), i20.classList.toggle("icon"), i20;
    }), t16 = this.contentSlot.assignedNodes().map((n18) => n18.cloneNode(true));
    return this._itemChildren = { icon: e22, content: t16 }, this._itemChildren;
  }
  click() {
    this.disabled || this.shouldProxyClick() || super.click();
  }
  handleClickCapture(e22) {
    if (this.disabled) return e22.preventDefault(), e22.stopImmediatePropagation(), e22.stopPropagation(), false;
  }
  shouldProxyClick() {
    let e22 = false;
    return this.anchorElement && (this.anchorElement.click(), e22 = true), e22;
  }
  breakItemChildrenCache() {
    this._itemChildren = void 0, this.triggerUpdate();
  }
  renderSubmenu() {
    const e22 = x`
            <slot
                name="submenu"
                @slotchange=${this.manageSubmenu}
                @sp-menu-item-added-or-updated=${{ handleEvent: (t16) => {
      t16.clear(t16.item);
    }, capture: true }}
                @focusin=${(t16) => t16.stopPropagation()}
            ></slot>
        `;
    return this.hasSubmenu ? (this.dependencyManager.add("sp-overlay"), this.dependencyManager.add("sp-popover"), Promise.resolve().then(() => init_sp_overlay()), Promise.resolve().then(() => init_sp_popover()), x`
            <sp-overlay
                .triggerElement=${this}
                ?disabled=${!this.hasSubmenu}
                ?open=${this.hasSubmenu && this.open && this.dependencyManager.loaded}
                .placement=${this.isLTR ? "right-start" : "left-start"}
                .offset=${[-10, -5]}
                .type=${"auto"}
                @close=${(t16) => t16.stopPropagation()}
                @slottable-request=${this.handleSlottableRequest}
            >
                <sp-popover
                    @change=${(t16) => {
      this.handleSubmenuChange(t16), this.open = false;
    }}
                    @pointerenter=${this.handleSubmenuPointerenter}
                    @pointerleave=${this.handleSubmenuPointerleave}
                    @sp-menu-item-added-or-updated=${(t16) => t16.stopPropagation()}
                >
                    ${e22}
                </sp-popover>
            </sp-overlay>
            <sp-icon-chevron100
                class="spectrum-UIIcon-ChevronRight100 chevron icon"
            ></sp-icon-chevron100>
        `) : e22;
  }
  render() {
    return x`
            ${this.selected ? x`
                      <sp-icon-checkmark100
                          id="selected"
                          class="spectrum-UIIcon-Checkmark100 
                            icon 
                            checkmark
                            ${this.hasIcon ? "checkmark--withAdjacentIcon" : ""}"
                      ></sp-icon-checkmark100>
                  ` : A}
            <slot name="icon"></slot>
            <div id="label">
                <slot id="slot"></slot>
            </div>
            <slot name="description"></slot>
            <slot name="value"></slot>
            ${this.href && this.href.length > 0 ? super.renderAnchor({ id: "button", ariaHidden: true, className: "button anchor hidden" }) : A}
            ${this.renderSubmenu()}
        `;
  }
  manageSubmenu(e22) {
    this.submenuElement = e22.target.assignedElements({ flatten: true })[0], this.hasSubmenu = !!this.submenuElement, this.hasSubmenu && this.setAttribute("aria-haspopup", "true");
  }
  handlePointerdown(e22) {
    e22.target === this && this.hasSubmenu && this.open && (this.addEventListener("focus", this.handleSubmenuFocus, { once: true }), this.overlayElement.addEventListener("beforetoggle", this.handleBeforetoggle));
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.setAttribute("tabindex", "-1"), this.addEventListener("pointerdown", this.handlePointerdown), this.addEventListener("pointerenter", this.closeOverlaysForRoot), this.hasAttribute("id") || (this.id = `sp-menu-item-${randomID()}`);
  }
  closeOverlaysForRoot() {
    var e22;
    this.open || (e22 = this.menuData.parentMenu) == null || e22.closeDescendentOverlays();
  }
  handleSubmenuClick(e22) {
    e22.composedPath().includes(this.overlayElement) || this.openOverlay();
  }
  handleSubmenuFocus() {
    requestAnimationFrame(() => {
      this.overlayElement.open = this.open;
    });
  }
  handlePointerenter() {
    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout), delete this.leaveTimeout;
      return;
    }
    this.openOverlay();
  }
  handlePointerleave() {
    this.open && !this.recentlyLeftChild && (this.leaveTimeout = setTimeout(() => {
      delete this.leaveTimeout, this.open = false;
    }, L2));
  }
  handleSubmenuChange(e22) {
    var t16;
    e22.stopPropagation(), (t16 = this.menuData.selectionRoot) == null || t16.selectOrToggleItem(this);
  }
  handleSubmenuPointerenter() {
    this.recentlyLeftChild = true;
  }
  async handleSubmenuPointerleave() {
    requestAnimationFrame(() => {
      this.recentlyLeftChild = false;
    });
  }
  handleSubmenuOpen(e22) {
    this.focused = false;
    const t16 = e22.composedPath().find((n18) => n18 !== this.overlayElement && n18.localName === "sp-overlay");
    this.overlayElement.parentOverlayToForceClose = t16;
  }
  cleanup() {
    this.open = false, this.active = false;
  }
  async openOverlay() {
    !this.hasSubmenu || this.open || this.disabled || (this.open = true, this.active = true, this.setAttribute("aria-expanded", "true"), this.addEventListener("sp-closed", this.cleanup, { once: true }));
  }
  updateAriaSelected() {
    const e22 = this.getAttribute("role");
    e22 === "option" ? this.setAttribute("aria-selected", this.selected ? "true" : "false") : (e22 === "menuitemcheckbox" || e22 === "menuitemradio") && this.setAttribute("aria-checked", this.selected ? "true" : "false");
  }
  setRole(e22) {
    this.setAttribute("role", e22), this.updateAriaSelected();
  }
  updated(e22) {
    var t16, n18;
    if (super.updated(e22), e22.has("label") && (this.label || typeof e22.get("label") != "undefined") && this.setAttribute("aria-label", this.label || ""), e22.has("active") && (this.active || typeof e22.get("active") != "undefined") && this.active && ((t16 = this.menuData.selectionRoot) == null || t16.closeDescendentOverlays()), this.anchorElement && (this.anchorElement.addEventListener("focus", this.proxyFocus), this.anchorElement.tabIndex = -1), e22.has("selected") && this.updateAriaSelected(), e22.has("hasSubmenu") && (this.hasSubmenu || typeof e22.get("hasSubmenu") != "undefined")) if (this.hasSubmenu) {
      this.abortControllerSubmenu = new AbortController();
      const i20 = { signal: this.abortControllerSubmenu.signal };
      this.addEventListener("click", this.handleSubmenuClick, i20), this.addEventListener("pointerenter", this.handlePointerenter, i20), this.addEventListener("pointerleave", this.handlePointerleave, i20), this.addEventListener("sp-opened", this.handleSubmenuOpen, i20);
    } else (n18 = this.abortControllerSubmenu) == null || n18.abort();
  }
  connectedCallback() {
    super.connectedCallback(), this.triggerUpdate();
  }
  disconnectedCallback() {
    this.menuData.cleanupSteps.forEach((e22) => e22(this)), this.menuData = { focusRoot: void 0, parentMenu: void 0, selectionRoot: void 0, cleanupSteps: [] }, super.disconnectedCallback();
  }
  async triggerUpdate() {
    this.willDispatchUpdate || (this.willDispatchUpdate = true, await new Promise((e22) => requestAnimationFrame(e22)), this.dispatchUpdate());
  }
  dispatchUpdate() {
    this.isConnected && (this.dispatchEvent(new MenuItemAddedOrUpdatedEvent(this)), this.willDispatchUpdate = false);
  }
};
r11([n7({ type: Boolean, reflect: true })], MenuItem.prototype, "active", 2), r11([n7({ type: Boolean, reflect: true })], MenuItem.prototype, "focused", 2), r11([n7({ type: Boolean, reflect: true })], MenuItem.prototype, "selected", 2), r11([n7({ type: String })], MenuItem.prototype, "value", 1), r11([n7({ type: Boolean, reflect: true, attribute: "has-submenu" })], MenuItem.prototype, "hasSubmenu", 2), r11([i5("slot:not([name])")], MenuItem.prototype, "contentSlot", 2), r11([i5('slot[name="icon"]')], MenuItem.prototype, "iconSlot", 2), r11([n7({ type: Boolean, reflect: true, attribute: "no-wrap", hasChanged() {
  return false;
} })], MenuItem.prototype, "noWrap", 2), r11([i5(".anchor")], MenuItem.prototype, "anchorElement", 2), r11([i5("sp-overlay")], MenuItem.prototype, "overlayElement", 2), r11([n7({ type: Boolean, reflect: true })], MenuItem.prototype, "open", 2);

// ../node_modules/@spectrum-web-components/menu/sp-menu-item.js
init_define_element();
defineElement("sp-menu-item", MenuItem);

// ../node_modules/@spectrum-web-components/menu/src/Menu.js
init_src();
init_decorators2();

// ../node_modules/@spectrum-web-components/menu/src/menu.css.js
init_src();
var t13 = i3`
    :host{--spectrum-menu-item-min-height:var(--spectrum-component-height-100);--spectrum-menu-item-icon-height:var(--spectrum-workflow-icon-size-100);--spectrum-menu-item-icon-width:var(--spectrum-workflow-icon-size-100);--spectrum-menu-item-label-font-size:var(--spectrum-font-size-100);--spectrum-menu-item-label-text-to-visual:var(--spectrum-text-to-visual-100);--spectrum-menu-item-label-inline-edge-to-content:var(--spectrum-component-edge-to-text-100);--spectrum-menu-item-top-edge-to-text:var(--spectrum-component-top-to-text-100);--spectrum-menu-item-bottom-edge-to-text:var(--spectrum-component-bottom-to-text-100);--spectrum-menu-item-text-to-control:var(--spectrum-text-to-control-100);--spectrum-menu-item-description-font-size:var(--spectrum-font-size-75);--spectrum-menu-section-header-font-size:var(--spectrum-font-size-100);--spectrum-menu-section-header-min-width:var(--spectrum-component-height-100);--spectrum-menu-item-selectable-edge-to-text-not-selected:var(--spectrum-menu-item-selectable-edge-to-text-not-selected-medium);--spectrum-menu-item-checkmark-height:var(--spectrum-menu-item-checkmark-height-medium);--spectrum-menu-item-checkmark-width:var(--spectrum-menu-item-checkmark-width-medium);--spectrum-menu-item-top-to-checkmark:var(--spectrum-menu-item-top-to-selected-icon-medium);--spectrum-menu-item-top-to-action:var(--spectrum-spacing-50);--spectrum-menu-item-top-to-checkbox:var(--spectrum-spacing-50);--spectrum-menu-item-label-line-height:var(--spectrum-line-height-100);--spectrum-menu-item-label-line-height-cjk:var(--spectrum-cjk-line-height-100);--spectrum-menu-item-label-to-description-spacing:var(--spectrum-menu-item-label-to-description);--spectrum-menu-item-focus-indicator-width:var(--spectrum-border-width-200);--spectrum-menu-item-focus-indicator-color:var(--spectrum-blue-800);--spectrum-menu-item-label-to-value-area-min-spacing:var(--spectrum-spacing-100);--spectrum-menu-item-label-content-color-default:var(--spectrum-neutral-content-color-default);--spectrum-menu-item-label-content-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-menu-item-label-content-color-down:var(--spectrum-neutral-content-color-down);--spectrum-menu-item-label-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-menu-item-label-icon-color-default:var(--spectrum-neutral-content-color-default);--spectrum-menu-item-label-icon-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-menu-item-label-icon-color-down:var(--spectrum-neutral-content-color-down);--spectrum-menu-item-label-icon-color-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-menu-item-label-content-color-disabled:var(--spectrum-disabled-content-color);--spectrum-menu-item-label-icon-color-disabled:var(--spectrum-disabled-content-color);--spectrum-menu-item-description-line-height:var(--spectrum-line-height-100);--spectrum-menu-item-description-line-height-cjk:var(--spectrum-cjk-line-height-100);--spectrum-menu-item-description-color-default:var(--spectrum-neutral-subdued-content-color-default);--spectrum-menu-item-description-color-hover:var(--spectrum-neutral-subdued-content-color-hover);--spectrum-menu-item-description-color-down:var(--spectrum-neutral-subdued-content-color-down);--spectrum-menu-item-description-color-focus:var(--spectrum-neutral-subdued-content-color-key-focus);--spectrum-menu-item-description-color-disabled:var(--spectrum-disabled-content-color);--spectrum-menu-section-header-line-height:var(--spectrum-line-height-100);--spectrum-menu-section-header-line-height-cjk:var(--spectrum-cjk-line-height-100);--spectrum-menu-section-header-font-weight:var(--spectrum-bold-font-weight);--spectrum-menu-section-header-color:var(--spectrum-gray-900);--spectrum-menu-collapsible-icon-color:var(--spectrum-gray-900);--spectrum-menu-checkmark-icon-color-default:var(--spectrum-accent-color-900);--spectrum-menu-checkmark-icon-color-hover:var(--spectrum-accent-color-1000);--spectrum-menu-checkmark-icon-color-down:var(--spectrum-accent-color-1100);--spectrum-menu-checkmark-icon-color-focus:var(--spectrum-accent-color-1000);--spectrum-menu-drillin-icon-color-default:var(--spectrum-neutral-subdued-content-color-default);--spectrum-menu-drillin-icon-color-hover:var(--spectrum-neutral-subdued-content-color-hover);--spectrum-menu-drillin-icon-color-down:var(--spectrum-neutral-subdued-content-color-down);--spectrum-menu-drillin-icon-color-focus:var(--spectrum-neutral-subdued-content-color-key-focus);--spectrum-menu-item-value-color-default:var(--spectrum-neutral-subdued-content-color-default);--spectrum-menu-item-value-color-hover:var(--spectrum-neutral-subdued-content-color-hover);--spectrum-menu-item-value-color-down:var(--spectrum-neutral-subdued-content-color-down);--spectrum-menu-item-value-color-focus:var(--spectrum-neutral-subdued-content-color-key-focus);--spectrum-menu-checkmark-display-hidden:none;--spectrum-menu-checkmark-display-shown:block;--spectrum-menu-checkmark-display:var(--spectrum-menu-checkmark-display-shown);--spectrum-menu-back-icon-margin:var(--spectrum-navigational-indicator-top-to-back-icon-medium);--spectrum-menu-item-collapsible-has-icon-submenu-item-padding-x-start:calc(var(--spectrum-menu-item-label-inline-edge-to-content) + var(--spectrum-menu-item-checkmark-width) + var(--spectrum-menu-item-text-to-control) + var(--spectrum-menu-item-icon-width) + var(--spectrum-menu-item-label-text-to-visual) + var(--spectrum-menu-item-focus-indicator-width));--spectrum-menu-item-collapsible-no-icon-submenu-item-padding-x-start:calc(var(--spectrum-menu-item-label-inline-edge-to-content) + var(--spectrum-menu-item-checkmark-width) + var(--spectrum-menu-item-label-text-to-visual) + var(--spectrum-menu-item-focus-indicator-width))}:host([size=s]){--spectrum-menu-item-min-height:var(--spectrum-component-height-75);--spectrum-menu-item-icon-height:var(--spectrum-workflow-icon-size-75);--spectrum-menu-item-icon-width:var(--spectrum-workflow-icon-size-75);--spectrum-menu-item-label-font-size:var(--spectrum-font-size-75);--spectrum-menu-item-label-text-to-visual:var(--spectrum-text-to-visual-75);--spectrum-menu-item-label-inline-edge-to-content:var(--spectrum-component-edge-to-text-75);--spectrum-menu-item-top-edge-to-text:var(--spectrum-component-top-to-text-75);--spectrum-menu-item-bottom-edge-to-text:var(--spectrum-component-bottom-to-text-75);--spectrum-menu-item-text-to-control:var(--spectrum-text-to-control-75);--spectrum-menu-item-description-font-size:var(--spectrum-font-size-50);--spectrum-menu-section-header-font-size:var(--spectrum-font-size-75);--spectrum-menu-section-header-min-width:var(--spectrum-component-height-75);--spectrum-menu-item-selectable-edge-to-text-not-selected:var(--spectrum-menu-item-selectable-edge-to-text-not-selected-small);--spectrum-menu-item-checkmark-height:var(--spectrum-menu-item-checkmark-height-small);--spectrum-menu-item-checkmark-width:var(--spectrum-menu-item-checkmark-width-small);--spectrum-menu-item-top-to-checkmark:var(--spectrum-menu-item-top-to-selected-icon-small);--spectrum-menu-back-icon-margin:var(--spectrum-navigational-indicator-top-to-back-icon-small)}:host([size=l]){--spectrum-menu-item-min-height:var(--spectrum-component-height-200);--spectrum-menu-item-icon-height:var(--spectrum-workflow-icon-size-200);--spectrum-menu-item-icon-width:var(--spectrum-workflow-icon-size-200);--spectrum-menu-item-label-font-size:var(--spectrum-font-size-200);--spectrum-menu-item-label-text-to-visual:var(--spectrum-text-to-visual-200);--spectrum-menu-item-label-inline-edge-to-content:var(--spectrum-component-edge-to-text-200);--spectrum-menu-item-top-edge-to-text:var(--spectrum-component-top-to-text-200);--spectrum-menu-item-bottom-edge-to-text:var(--spectrum-component-bottom-to-text-200);--spectrum-menu-item-text-to-control:var(--spectrum-text-to-control-200);--spectrum-menu-item-description-font-size:var(--spectrum-font-size-100);--spectrum-menu-section-header-font-size:var(--spectrum-font-size-200);--spectrum-menu-section-header-min-width:var(--spectrum-component-height-200);--spectrum-menu-item-selectable-edge-to-text-not-selected:var(--spectrum-menu-item-selectable-edge-to-text-not-selected-large);--spectrum-menu-item-checkmark-height:var(--spectrum-menu-item-checkmark-height-large);--spectrum-menu-item-checkmark-width:var(--spectrum-menu-item-checkmark-width-large);--spectrum-menu-item-top-to-checkmark:var(--spectrum-menu-item-top-to-selected-icon-large);--spectrum-menu-back-icon-margin:var(--spectrum-navigational-indicator-top-to-back-icon-large)}:host([size=xl]){--spectrum-menu-item-min-height:var(--spectrum-component-height-300);--spectrum-menu-item-icon-height:var(--spectrum-workflow-icon-size-300);--spectrum-menu-item-icon-width:var(--spectrum-workflow-icon-size-300);--spectrum-menu-item-label-font-size:var(--spectrum-font-size-300);--spectrum-menu-item-label-text-to-visual:var(--spectrum-text-to-visual-300);--spectrum-menu-item-label-inline-edge-to-content:var(--spectrum-component-edge-to-text-300);--spectrum-menu-item-top-edge-to-text:var(--spectrum-component-top-to-text-300);--spectrum-menu-item-bottom-edge-to-text:var(--spectrum-component-bottom-to-text-300);--spectrum-menu-item-text-to-control:var(--spectrum-text-to-control-300);--spectrum-menu-item-description-font-size:var(--spectrum-font-size-200);--spectrum-menu-section-header-font-size:var(--spectrum-font-size-300);--spectrum-menu-section-header-min-width:var(--spectrum-component-height-300);--spectrum-menu-item-selectable-edge-to-text-not-selected:var(--spectrum-menu-item-selectable-edge-to-text-not-selected-extra-large);--spectrum-menu-item-checkmark-height:var(--spectrum-menu-item-checkmark-height-extra-large);--spectrum-menu-item-checkmark-width:var(--spectrum-menu-item-checkmark-width-extra-large);--spectrum-menu-item-top-to-checkmark:var(--spectrum-menu-item-top-to-selected-icon-extra-large);--spectrum-menu-back-icon-margin:var(--spectrum-navigational-indicator-top-to-back-icon-extra-large)}@media (forced-colors:active){:host{--highcontrast-menu-item-background-color-default:ButtonFace;--highcontrast-menu-item-color-default:ButtonText;--highcontrast-menu-item-background-color-focus:Highlight;--highcontrast-menu-item-color-focus:HighlightText;--highcontrast-menu-checkmark-icon-color-default:Highlight;--highcontrast-menu-item-color-disabled:GrayText;--highcontrast-menu-item-focus-indicator-color:Highlight;--highcontrast-menu-item-selected-background-color:Highlight;--highcontrast-menu-item-selected-color:HighlightText}@supports (color:SelectedItem){:host{--highcontrast-menu-item-selected-background-color:SelectedItem;--highcontrast-menu-item-selected-color:SelectedItemText}}}:host{inline-size:var(--mod-menu-inline-size,auto);box-sizing:border-box;margin:0;padding:0;list-style-type:none;display:inline-block;overflow:auto}:host:lang(ja),:host:lang(ko),:host:lang(zh){--spectrum-menu-item-label-line-height:var(--mod-menu-item-label-line-height-cjk,var(--spectrum-menu-item-label-line-height-cjk));--spectrum-menu-item-description-line-height:var(--mod-menu-item-description-line-height-cjk,var(--spectrum-menu-item-description-line-height-cjk));--spectrum-menu-section-header-line-height:var(--mod-menu-section-header-line-height-cjk,var(--spectrum-menu-section-header-line-height-cjk))}:host([selects]) ::slotted(sp-menu-item){--spectrum-menu-checkmark-display:var(--spectrum-menu-checkmark-display-hidden);padding-inline-start:var(--mod-menu-item-selectable-edge-to-text-not-selected,var(--spectrum-menu-item-selectable-edge-to-text-not-selected))}:host([selects]) ::slotted(sp-menu-item[selected]){--spectrum-menu-checkmark-display:var(--spectrum-menu-checkmark-display-shown);padding-inline-start:var(--mod-menu-item-label-inline-edge-to-content,var(--spectrum-menu-item-label-inline-edge-to-content))}.spectrum-Menu-back:focus-visible{box-shadow:inset calc(var(--mod-menu-item-focus-indicator-width,var(--spectrum-menu-item-focus-indicator-width))*var(--spectrum-menu-item-focus-indicator-direction-scalar,1))0 0 0 var(--highcontrast-menu-item-focus-indicator-color,var(--mod-menu-item-focus-indicator-color,var(--spectrum-menu-item-focus-indicator-color)))}.spectrum-Menu-sectionHeading{color:var(--highcontrast-menu-item-color-default,var(--mod-menu-section-header-color,var(--spectrum-menu-section-header-color)));font-size:var(--mod-menu-section-header-font-size,var(--spectrum-menu-section-header-font-size));font-weight:var(--mod-menu-section-header-font-weight,var(--spectrum-menu-section-header-font-weight));line-height:var(--mod-menu-section-header-line-height,var(--spectrum-menu-section-header-line-height));min-inline-size:var(--mod-menu-section-header-min-width,var(--spectrum-menu-section-header-min-width));padding-block-start:var(--mod-menu-section-header-top-edge-to-text,var(--mod-menu-item-top-edge-to-text,var(--spectrum-menu-item-top-edge-to-text)));padding-block-end:var(--mod-menu-section-header-bottom-edge-to-text,var(--mod-menu-item-bottom-edge-to-text,var(--spectrum-menu-item-bottom-edge-to-text)));padding-inline:var(--mod-menu-item-label-inline-edge-to-content,var(--spectrum-menu-item-label-inline-edge-to-content));grid-area:c/1/c/-1;display:block}.spectrum-Menu-back{padding-inline:var(--mod-menu-back-padding-inline-start,0)var(--mod-menu-back-padding-inline-end,var(--spectrum-menu-item-label-inline-edge-to-content));padding-block:var(--mod-menu-back-padding-block-start,0)var(--mod-menu-back-padding-block-end,0);flex-flow:wrap;align-items:center;display:flex}.spectrum-Menu-back .spectrum-Menu-sectionHeading{padding:0}.spectrum-Menu-backButton{cursor:pointer;background:0 0;border:0;margin:0;padding:0;display:inline-flex}.spectrum-Menu-backButton:focus-visible{outline:var(--spectrum-focus-indicator-thickness)solid var(--spectrum-focus-indicator-color);outline-offset:calc((var(--spectrum-focus-indicator-thickness) + 1px)*-1)}.spectrum-Menu-backHeading{color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-heading-color,var(--spectrum-menu-section-header-color)));font-size:var(--mod-menu-section-header-font-size,var(--spectrum-menu-section-header-font-size));font-weight:var(--mod-menu-section-header-font-weight,var(--spectrum-menu-section-header-font-weight));line-height:var(--mod-menu-section-header-line-height,var(--spectrum-menu-section-header-line-height));display:block}.spectrum-Menu-backIcon{margin-block:var(--mod-menu-back-icon-margin-block,var(--spectrum-menu-back-icon-margin));margin-inline:var(--mod-menu-back-icon-margin-inline,var(--spectrum-menu-back-icon-margin));fill:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default));color:var(--highcontrast-menu-item-color-default,var(--mod-menu-back-icon-color-default))}:host{width:var(--swc-menu-width);flex-direction:column;display:inline-flex}:host(:focus){outline:none}::slotted(*){flex-shrink:0}
`;
var menu_css_default = t13;

// ../node_modules/@spectrum-web-components/menu/src/Menu.js
var p14 = Object.defineProperty;
var f6 = Object.getOwnPropertyDescriptor;
var o24 = (c19, l14, e22, s14) => {
  for (var t16 = s14 > 1 ? void 0 : s14 ? f6(l14, e22) : l14, i20 = c19.length - 1, n18; i20 >= 0; i20--) (n18 = c19[i20]) && (t16 = (s14 ? n18(l14, e22, t16) : n18(t16)) || t16);
  return s14 && t16 && p14(l14, e22, t16), t16;
};
function S4(c19, l14) {
  return !!l14 && (c19 === l14 || c19.contains(l14));
}
var Menu = class extends SizedMixin(SpectrumElement, { noDefaultSize: true }) {
  constructor() {
    super();
    this.label = "";
    this.ignore = false;
    this.value = "";
    this.valueSeparator = ",";
    this._selected = [];
    this.selectedItems = [];
    this.childItemSet = /* @__PURE__ */ new Set();
    this.focusedItemIndex = 0;
    this.focusInItemIndex = 0;
    this.selectedItemsMap = /* @__PURE__ */ new Map();
    this.willSynthesizeClick = 0;
    this.descendentOverlays = /* @__PURE__ */ new Map();
    this.handleSubmenuClosed = (e22) => {
      e22.stopPropagation(), e22.composedPath()[0].dispatchEvent(new Event("sp-menu-submenu-closed", { bubbles: true, composed: true }));
    };
    this.handleSubmenuOpened = (e22) => {
      e22.stopPropagation(), e22.composedPath()[0].dispatchEvent(new Event("sp-menu-submenu-opened", { bubbles: true, composed: true }));
      const t16 = this.childItems[this.focusedItemIndex];
      t16 && (t16.focused = false);
      const i20 = e22.composedPath().find((d13) => this.childItemSet.has(d13));
      if (!i20) return;
      const n18 = this.childItems.indexOf(i20);
      this.focusedItemIndex = n18, this.focusInItemIndex = n18;
    };
    this._hasUpdatedSelectedItemIndex = false;
    this._willUpdateItems = false;
    this.cacheUpdated = Promise.resolve();
    this.resolveCacheUpdated = () => {
    };
    this.addEventListener("sp-menu-item-added-or-updated", this.onSelectableItemAddedOrUpdated), this.addEventListener("sp-menu-item-added-or-updated", this.onFocusableItemAddedOrUpdated, { capture: true }), this.addEventListener("click", this.handleClick), this.addEventListener("pointerup", this.handlePointerup), this.addEventListener("focusin", this.handleFocusin), this.addEventListener("blur", this.handleBlur), this.addEventListener("sp-opened", this.handleSubmenuOpened), this.addEventListener("sp-closed", this.handleSubmenuClosed);
  }
  static get styles() {
    return [menu_css_default];
  }
  get isSubmenu() {
    return this.slot === "submenu";
  }
  get selected() {
    return this._selected;
  }
  set selected(e22) {
    if (e22 === this.selected) return;
    const s14 = this.selected;
    this._selected = e22, this.selectedItems = [], this.selectedItemsMap.clear(), this.childItems.forEach((t16) => {
      this === t16.menuData.selectionRoot && (t16.selected = this.selected.includes(t16.value), t16.selected && (this.selectedItems.push(t16), this.selectedItemsMap.set(t16, true)));
    }), this.requestUpdate("selected", s14);
  }
  get childItems() {
    return this.cachedChildItems || (this.cachedChildItems = this.updateCachedMenuItems()), this.cachedChildItems;
  }
  updateCachedMenuItems() {
    if (this.cachedChildItems = [], !this.menuSlot) return [];
    const e22 = this.menuSlot.assignedElements({ flatten: true });
    for (const [s14, t16] of e22.entries()) {
      if (this.childItemSet.has(t16)) {
        this.cachedChildItems.push(t16);
        continue;
      }
      const n18 = t16.localName === "slot" ? t16.assignedElements({ flatten: true }) : [...t16.querySelectorAll(":scope > *")];
      e22.splice(s14, 1, t16, ...n18);
    }
    return this.cachedChildItems;
  }
  get childRole() {
    if (this.resolvedRole === "listbox") return "option";
    switch (this.resolvedSelects) {
      case "single":
        return "menuitemradio";
      case "multiple":
        return "menuitemcheckbox";
      default:
        return "menuitem";
    }
  }
  get ownRole() {
    return "menu";
  }
  onFocusableItemAddedOrUpdated(e22) {
    e22.menuCascade.set(this, { hadFocusRoot: !!e22.item.menuData.focusRoot, ancestorWithSelects: e22.currentAncestorWithSelects }), this.selects && (e22.currentAncestorWithSelects = this), e22.item.menuData.focusRoot = e22.item.menuData.focusRoot || this;
  }
  onSelectableItemAddedOrUpdated(e22) {
    var i20, n18;
    const s14 = e22.menuCascade.get(this);
    if (!s14) return;
    if (e22.item.menuData.parentMenu = e22.item.menuData.parentMenu || this, s14.hadFocusRoot && !this.ignore && (this.tabIndex = -1), this.addChildItem(e22.item), this.selects === "inherit") {
      this.resolvedSelects = "inherit";
      const d13 = (i20 = e22.currentAncestorWithSelects) == null ? void 0 : i20.ignore;
      this.resolvedRole = d13 ? "none" : ((n18 = e22.currentAncestorWithSelects) == null ? void 0 : n18.getAttribute("role")) || this.getAttribute("role") || void 0;
    } else this.selects ? (this.resolvedRole = this.ignore ? "none" : this.getAttribute("role") || void 0, this.resolvedSelects = this.selects) : (this.resolvedRole = this.ignore ? "none" : this.getAttribute("role") || void 0, this.resolvedSelects = this.resolvedRole === "none" ? "ignore" : "none");
    const t16 = this.resolvedSelects === "single" || this.resolvedSelects === "multiple";
    e22.item.menuData.cleanupSteps.push((d13) => this.removeChildItem(d13)), (t16 || !this.selects && this.resolvedSelects !== "ignore") && !e22.item.menuData.selectionRoot && (e22.item.setRole(this.childRole), e22.item.menuData.selectionRoot = e22.item.menuData.selectionRoot || this, e22.item.selected && (this.selectedItemsMap.set(e22.item, true), this.selectedItems = [...this.selectedItems, e22.item], this._selected = [...this.selected, e22.item.value], this.value = this.selected.join(this.valueSeparator)));
  }
  addChildItem(e22) {
    this.childItemSet.add(e22), this.handleItemsChanged();
  }
  async removeChildItem(e22) {
    this.childItemSet.delete(e22), this.cachedChildItems = void 0, e22.focused && (this.handleItemsChanged(), await this.updateComplete, this.focus());
  }
  focus({ preventScroll: e22 } = {}) {
    if (!this.childItems.length || this.childItems.every((t16) => t16.disabled)) return;
    if (this.childItems.some((t16) => t16.menuData.focusRoot !== this)) {
      super.focus({ preventScroll: e22 });
      return;
    }
    this.focusMenuItemByOffset(0), super.focus({ preventScroll: e22 });
    const s14 = this.selectedItems[0];
    s14 && !e22 && s14.scrollIntoView({ block: "nearest" });
  }
  handleClick(e22) {
    if (this.willSynthesizeClick) {
      cancelAnimationFrame(this.willSynthesizeClick), this.willSynthesizeClick = 0;
      return;
    }
    this.handlePointerBasedSelection(e22);
  }
  handlePointerup(e22) {
    this.willSynthesizeClick = requestAnimationFrame(() => {
      var s14;
      (s14 = e22.target) == null || s14.dispatchEvent(new Event("click")), this.willSynthesizeClick = 0;
    }), this.handlePointerBasedSelection(e22);
  }
  handlePointerBasedSelection(e22) {
    const t16 = e22.composedPath().find((i20) => i20 instanceof Element ? i20.getAttribute("role") === this.childRole : false);
    if (e22.defaultPrevented) {
      const i20 = this.childItems.indexOf(t16);
      (t16 == null ? void 0 : t16.menuData.focusRoot) === this && i20 > -1 && (this.focusedItemIndex = i20);
      return;
    }
    if (t16 != null && t16.href && t16.href.length) {
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      return;
    } else if ((t16 == null ? void 0 : t16.menuData.selectionRoot) === this && this.childItems.length) {
      if (e22.preventDefault(), t16.hasSubmenu || t16.open) return;
      this.selectOrToggleItem(t16);
    } else return;
    this.prepareToCleanUp();
  }
  handleFocusin(e22) {
    var i20;
    if (this.childItems.some((n18) => n18.menuData.focusRoot !== this)) return;
    const s14 = this.getRootNode().activeElement, t16 = ((i20 = this.childItems[this.focusedItemIndex]) == null ? void 0 : i20.menuData.selectionRoot) || this;
    if ((s14 !== t16 || e22.target !== this) && (t16.focus({ preventScroll: true }), s14 && this.focusedItemIndex === 0)) {
      const n18 = this.childItems.findIndex((d13) => d13 === s14);
      this.focusMenuItemByOffset(Math.max(n18, 0));
    }
    this.startListeningToKeyboard();
  }
  startListeningToKeyboard() {
    this.addEventListener("keydown", this.handleKeydown);
  }
  handleBlur(e22) {
    S4(this, e22.relatedTarget) || (this.stopListeningToKeyboard(), this.childItems.forEach((s14) => s14.focused = false), this.removeAttribute("aria-activedescendant"));
  }
  stopListeningToKeyboard() {
    this.removeEventListener("keydown", this.handleKeydown);
  }
  handleDescendentOverlayOpened(e22) {
    const s14 = e22.composedPath()[0];
    s14.overlayElement && this.descendentOverlays.set(s14.overlayElement, s14.overlayElement);
  }
  handleDescendentOverlayClosed(e22) {
    const s14 = e22.composedPath()[0];
    s14.overlayElement && this.descendentOverlays.delete(s14.overlayElement);
  }
  async selectOrToggleItem(e22) {
    const s14 = this.resolvedSelects, t16 = new Map(this.selectedItemsMap), i20 = this.selected.slice(), n18 = this.selectedItems.slice(), d13 = this.value, r16 = this.childItems[this.focusedItemIndex];
    if (r16 && (r16.focused = false, r16.active = false), this.focusedItemIndex = this.childItems.indexOf(e22), this.forwardFocusVisibleToItem(e22), s14 === "multiple") {
      this.selectedItemsMap.has(e22) ? this.selectedItemsMap.delete(e22) : this.selectedItemsMap.set(e22, true);
      const h11 = [], m10 = [];
      this.childItemSet.forEach((u14) => {
        u14.menuData.selectionRoot === this && this.selectedItemsMap.has(u14) && (h11.push(u14.value), m10.push(u14));
      }), this._selected = h11, this.selectedItems = m10, this.value = this.selected.join(this.valueSeparator);
    } else this.selectedItemsMap.clear(), this.selectedItemsMap.set(e22, true), this.value = e22.value, this._selected = [e22.value], this.selectedItems = [e22];
    if (!this.dispatchEvent(new Event("change", { cancelable: true, bubbles: true, composed: true }))) {
      this._selected = i20, this.selectedItems = n18, this.selectedItemsMap = t16, this.value = d13;
      return;
    }
    if (s14 === "single") {
      for (const h11 of t16.keys()) h11 !== e22 && (h11.selected = false);
      e22.selected = true;
    } else s14 === "multiple" && (e22.selected = !e22.selected);
  }
  navigateWithinMenu(e22) {
    const { key: s14 } = e22, t16 = this.childItems[this.focusedItemIndex], i20 = s14 === "ArrowDown" ? 1 : -1, n18 = this.focusMenuItemByOffset(i20);
    n18 !== t16 && (e22.preventDefault(), e22.stopPropagation(), n18.scrollIntoView({ block: "nearest" }));
  }
  navigateBetweenRelatedMenus(e22) {
    const { key: s14 } = e22, t16 = this.isLTR && s14 === "ArrowRight" || !this.isLTR && s14 === "ArrowLeft", i20 = this.isLTR && s14 === "ArrowLeft" || !this.isLTR && s14 === "ArrowRight";
    if (t16) {
      e22.stopPropagation();
      const n18 = this.childItems[this.focusedItemIndex];
      n18 != null && n18.hasSubmenu && n18.openOverlay();
    } else i20 && this.isSubmenu && (e22.stopPropagation(), this.dispatchEvent(new Event("close", { bubbles: true })), this.updateSelectedItemIndex());
  }
  handleKeydown(e22) {
    if (e22.defaultPrevented) return;
    const s14 = this.childItems[this.focusedItemIndex];
    s14 && (s14.focused = true);
    const { key: t16 } = e22;
    if (e22.shiftKey && e22.target !== this && this.hasAttribute("tabindex")) {
      this.removeAttribute("tabindex");
      const i20 = (n18) => {
        !n18.shiftKey && !this.hasAttribute("tabindex") && (this.tabIndex = 0, document.removeEventListener("keyup", i20), this.removeEventListener("focusout", i20));
      };
      document.addEventListener("keyup", i20), this.addEventListener("focusout", i20);
    }
    if (t16 === "Tab") {
      this.prepareToCleanUp();
      return;
    }
    if (t16 === " " && s14 != null && s14.hasSubmenu) {
      s14.openOverlay();
      return;
    }
    if (t16 === " " || t16 === "Enter") {
      const i20 = this.childItems[this.focusedItemIndex];
      i20 && i20.menuData.selectionRoot === e22.target && (e22.preventDefault(), i20.click());
      return;
    }
    if (t16 === "ArrowDown" || t16 === "ArrowUp") {
      const i20 = this.childItems[this.focusedItemIndex];
      i20 && i20.menuData.selectionRoot === e22.target && this.navigateWithinMenu(e22);
      return;
    }
    this.navigateBetweenRelatedMenus(e22);
  }
  focusMenuItemByOffset(e22) {
    const s14 = e22 || 1, t16 = this.childItems[this.focusedItemIndex];
    t16 && (t16.focused = false, t16.active = t16.open), this.focusedItemIndex = (this.childItems.length + this.focusedItemIndex + e22) % this.childItems.length;
    let i20 = this.childItems[this.focusedItemIndex], n18 = this.childItems.length;
    for (; i20 != null && i20.disabled && n18; ) n18 -= 1, this.focusedItemIndex = (this.childItems.length + this.focusedItemIndex + s14) % this.childItems.length, i20 = this.childItems[this.focusedItemIndex];
    return i20 != null && i20.disabled || this.forwardFocusVisibleToItem(i20), i20;
  }
  prepareToCleanUp() {
    document.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        const e22 = this.childItems[this.focusedItemIndex];
        e22 && (e22.focused = false, this.updateSelectedItemIndex());
      });
    }, { once: true });
  }
  updateSelectedItemIndex() {
    let e22 = 0;
    const s14 = /* @__PURE__ */ new Map(), t16 = [], i20 = [];
    let n18 = this.childItems.length;
    for (; n18; ) {
      n18 -= 1;
      const d13 = this.childItems[n18];
      d13.menuData.selectionRoot === this && ((d13.selected || !this._hasUpdatedSelectedItemIndex && this.selected.includes(d13.value)) && (e22 = n18, s14.set(d13, true), t16.unshift(d13.value), i20.unshift(d13)), n18 !== e22 && (d13.focused = false));
    }
    i20.map((d13, r16) => {
      r16 > 0 && (d13.focused = false);
    }), this.selectedItemsMap = s14, this._selected = t16, this.selectedItems = i20, this.value = this.selected.join(this.valueSeparator), this.focusedItemIndex = e22, this.focusInItemIndex = e22;
  }
  handleItemsChanged() {
    this.cachedChildItems = void 0, this._willUpdateItems || (this._willUpdateItems = true, this.cacheUpdated = this.updateCache());
  }
  async updateCache() {
    this.hasUpdated ? await new Promise((e22) => requestAnimationFrame(() => e22(true))) : await Promise.all([new Promise((e22) => requestAnimationFrame(() => e22(true))), this.updateComplete]), this.cachedChildItems === void 0 && (this.updateSelectedItemIndex(), this.updateItemFocus()), this._willUpdateItems = false;
  }
  updateItemFocus() {
    if (this.childItems.length == 0) return;
    const e22 = this.childItems[this.focusInItemIndex];
    this.getRootNode().activeElement === e22.menuData.focusRoot && this.forwardFocusVisibleToItem(e22);
  }
  closeDescendentOverlays() {
    this.descendentOverlays.forEach((e22) => {
      e22.open = false;
    }), this.descendentOverlays = /* @__PURE__ */ new Map();
  }
  forwardFocusVisibleToItem(e22) {
    if (!e22 || e22.menuData.focusRoot !== this) return;
    this.closeDescendentOverlays();
    const s14 = this.hasVisibleFocusInTree() || !!this.childItems.find((t16) => t16.hasVisibleFocusInTree());
    e22.focused = s14, this.setAttribute("aria-activedescendant", e22.id), e22.menuData.selectionRoot && e22.menuData.selectionRoot !== this && e22.menuData.selectionRoot.focus();
  }
  handleSlotchange({ target: e22 }) {
    const s14 = e22.assignedElements({ flatten: true });
    this.childItems.length !== s14.length && s14.forEach((t16) => {
      typeof t16.triggerUpdate != "undefined" ? t16.triggerUpdate() : typeof t16.childItems != "undefined" && t16.childItems.forEach((i20) => {
        i20.triggerUpdate();
      });
    });
  }
  renderMenuItemSlot() {
    return x`
            <slot
                @sp-menu-submenu-opened=${this.handleDescendentOverlayOpened}
                @sp-menu-submenu-closed=${this.handleDescendentOverlayClosed}
                @slotchange=${this.handleSlotchange}
            ></slot>
        `;
  }
  render() {
    return this.renderMenuItemSlot();
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), !this.hasAttribute("tabindex") && !this.ignore && (this.getAttribute("role") === "group" ? this.tabIndex = -1 : this.tabIndex = 0);
    const s14 = [new Promise((t16) => requestAnimationFrame(() => t16(true)))];
    [...this.children].forEach((t16) => {
      t16.localName === "sp-menu-item" && s14.push(t16.updateComplete);
    }), this.childItemsUpdated = Promise.all(s14);
  }
  updated(e22) {
    super.updated(e22), e22.has("selects") && this.hasUpdated && this.selectsChanged(), e22.has("label") && (this.label || typeof e22.get("label") != "undefined") && (this.label ? this.setAttribute("aria-label", this.label) : this.removeAttribute("aria-label"));
  }
  selectsChanged() {
    const e22 = [new Promise((s14) => requestAnimationFrame(() => s14(true)))];
    this.childItemSet.forEach((s14) => {
      e22.push(s14.triggerUpdate());
    }), this.childItemsUpdated = Promise.all(e22);
  }
  connectedCallback() {
    super.connectedCallback(), !this.hasAttribute("role") && !this.ignore && this.setAttribute("role", this.ownRole), this.updateComplete.then(() => this.updateItemFocus());
  }
  disconnectedCallback() {
    this.cachedChildItems = void 0, this.selectedItems = [], this.selectedItemsMap.clear(), this.childItemSet.clear(), this.descendentOverlays = /* @__PURE__ */ new Map(), super.disconnectedCallback();
  }
  async getUpdateComplete() {
    const e22 = await super.getUpdateComplete();
    return await this.childItemsUpdated, await this.cacheUpdated, e22;
  }
};
o24([n7({ type: String, reflect: true })], Menu.prototype, "label", 2), o24([n7({ type: Boolean, reflect: true })], Menu.prototype, "ignore", 2), o24([n7({ type: String, reflect: true })], Menu.prototype, "selects", 2), o24([n7({ type: String })], Menu.prototype, "value", 2), o24([n7({ type: String, attribute: "value-separator" })], Menu.prototype, "valueSeparator", 2), o24([n7({ attribute: false })], Menu.prototype, "selected", 1), o24([n7({ attribute: false })], Menu.prototype, "selectedItems", 2), o24([i5("slot:not([name])")], Menu.prototype, "menuSlot", 2);

// ../node_modules/@spectrum-web-components/menu/sp-menu.js
init_define_element();
defineElement("sp-menu", Menu);

// src/swc.js
init_sp_overlay();

// ../node_modules/@spectrum-web-components/picker/src/Picker.js
init_src();
init_directives();
init_decorators2();

// ../node_modules/@spectrum-web-components/picker/src/picker.css.js
init_src();
var o25 = i3`
    #button{cursor:pointer;-webkit-user-select:none;user-select:none;font-family:var(--mod-button-font-family,var(--mod-sans-font-family-stack,var(--spectrum-sans-font-family-stack)));line-height:var(--mod-button-line-height,var(--mod-line-height-100,var(--spectrum-line-height-100)));text-transform:none;vertical-align:top;-webkit-appearance:button;transition:background var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,border-color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,color var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out,box-shadow var(--mod-button-animation-duration,var(--mod-animation-duration-100,var(--spectrum-animation-duration-100)))ease-out;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;justify-content:center;align-items:center;margin:0;-webkit-text-decoration:none;text-decoration:none;display:inline-flex;position:relative;overflow:visible}#button::-moz-focus-inner{border:0;margin-block:-2px;padding:0}#button:focus{outline:none}:host{--spectrum-picker-font-size:var(--spectrum-font-size-100);--spectrum-picker-font-weight:var(--spectrum-regular-font-weight);--spectrum-picker-placeholder-font-style:var(--spectrum-default-font-style);--spectrum-picker-line-height:var(--spectrum-line-height-100);--spectrum-picker-block-size:var(--spectrum-component-height-100);--spectrum-picker-inline-size:var(--spectrum-field-width);--spectrum-picker-border-radius:var(--spectrum-corner-radius-100);--spectrum-picker-spacing-top-to-text:var(--spectrum-component-top-to-text-100);--spectrum-picker-spacing-bottom-to-text:var(--spectrum-component-bottom-to-text-100);--spectrum-picker-spacing-edge-to-text:var(--spectrum-component-edge-to-text-100);--spectrum-picker-spacing-edge-to-text-quiet:var(--spectrum-field-edge-to-text-quiet);--spectrum-picker-spacing-top-to-text-side-label-quiet:var(--spectrum-component-top-to-text-100);--spectrum-picker-spacing-label-to-picker:var(--spectrum-field-label-to-component);--spectrum-picker-spacing-text-to-icon:var(--spectrum-text-to-visual-100);--spectrum-picker-spacing-text-to-icon-inline-end:var(--spectrum-field-text-to-alert-icon-medium);--spectrum-picker-spacing-icon-to-disclosure-icon:var(--spectrum-picker-visual-to-disclosure-icon-medium);--spectrum-picker-spacing-label-to-picker-quiet:var(--spectrum-field-label-to-component-quiet-medium);--spectrum-picker-spacing-top-to-alert-icon:var(--spectrum-field-top-to-alert-icon-medium);--spectrum-picker-spacing-top-to-progress-circle:var(--spectrum-field-top-to-progress-circle-medium);--spectrum-picker-spacing-top-to-disclosure-icon:var(--spectrum-field-top-to-disclosure-icon-100);--spectrum-picker-spacing-edge-to-disclosure-icon:var(--spectrum-field-end-edge-to-disclosure-icon-100);--spectrum-picker-spacing-edge-to-disclosure-icon-quiet:var(--spectrum-picker-end-edge-to-disclousure-icon-quiet);--spectrum-picker-animation-duration:var(--spectrum-animation-duration-100);--spectrum-picker-font-color-default:var(--spectrum-neutral-content-color-default);--spectrum-picker-font-color-default-open:var(--spectrum-neutral-content-color-focus);--spectrum-picker-font-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-picker-font-color-hover-open:var(--spectrum-neutral-content-color-focus-hover);--spectrum-picker-font-color-active:var(--spectrum-neutral-content-color-down);--spectrum-picker-font-color-key-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-picker-icon-color-default:var(--spectrum-neutral-content-color-default);--spectrum-picker-icon-color-default-open:var(--spectrum-neutral-content-color-focus);--spectrum-picker-icon-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-picker-icon-color-hover-open:var(--spectrum-neutral-content-color-focus-hover);--spectrum-picker-icon-color-active:var(--spectrum-neutral-content-color-down);--spectrum-picker-icon-color-key-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-picker-border-color-error-default:var(--spectrum-negative-border-color-default);--spectrum-picker-border-color-error-default-open:var(--spectrum-negative-border-color-focus);--spectrum-picker-border-color-error-hover:var(--spectrum-negative-border-color-hover);--spectrum-picker-border-color-error-hover-open:var(--spectrum-negative-border-color-focus-hover);--spectrum-picker-border-color-error-active:var(--spectrum-negative-border-color-down);--spectrum-picker-border-color-error-key-focus:var(--spectrum-negative-border-color-key-focus);--spectrum-picker-icon-color-error:var(--spectrum-negative-visual-color);--spectrum-picker-background-color-disabled:var(--spectrum-disabled-background-color);--spectrum-picker-font-color-disabled:var(--spectrum-disabled-content-color);--spectrum-picker-icon-color-disabled:var(--spectrum-disabled-content-color);--spectrum-picker-focus-indicator-gap:var(--spectrum-focus-indicator-gap);--spectrum-picker-focus-indicator-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-picker-focus-indicator-color:var(--spectrum-focus-indicator-color)}:host([size=s]){--spectrum-picker-font-size:var(--spectrum-font-size-75);--spectrum-picker-block-size:var(--spectrum-component-height-75);--spectrum-picker-spacing-top-to-text-side-label-quiet:var(--spectrum-component-top-to-text-75);--spectrum-picker-spacing-top-to-text:var(--spectrum-component-top-to-text-75);--spectrum-picker-spacing-bottom-to-text:var(--spectrum-component-bottom-to-text-75);--spectrum-picker-spacing-edge-to-text:var(--spectrum-component-edge-to-text-75);--spectrum-picker-spacing-text-to-icon:var(--spectrum-text-to-visual-75);--spectrum-picker-spacing-text-to-icon-inline-end:var(--spectrum-field-text-to-alert-icon-small);--spectrum-picker-spacing-icon-to-disclosure-icon:var(--spectrum-picker-visual-to-disclosure-icon-small);--spectrum-picker-spacing-label-to-picker-quiet:var(--spectrum-field-label-to-component-quiet-small);--spectrum-picker-spacing-top-to-alert-icon:var(--spectrum-field-top-to-alert-icon-small);--spectrum-picker-spacing-top-to-progress-circle:var(--spectrum-field-top-to-progress-circle-small);--spectrum-picker-spacing-top-to-disclosure-icon:var(--spectrum-field-top-to-disclosure-icon-75);--spectrum-picker-spacing-edge-to-disclosure-icon:var(--spectrum-field-end-edge-to-disclosure-icon-75)}:host([size=l]){--spectrum-picker-font-size:var(--spectrum-font-size-200);--spectrum-picker-block-size:var(--spectrum-component-height-200);--spectrum-picker-spacing-top-to-text-side-label-quiet:var(--spectrum-component-top-to-text-200);--spectrum-picker-spacing-top-to-text:var(--spectrum-component-top-to-text-200);--spectrum-picker-spacing-bottom-to-text:var(--spectrum-component-bottom-to-text-200);--spectrum-picker-spacing-edge-to-text:var(--spectrum-component-edge-to-text-200);--spectrum-picker-spacing-text-to-icon:var(--spectrum-text-to-visual-200);--spectrum-picker-spacing-text-to-icon-inline-end:var(--spectrum-field-text-to-alert-icon-large);--spectrum-picker-spacing-icon-to-disclosure-icon:var(--spectrum-picker-visual-to-disclosure-icon-large);--spectrum-picker-spacing-label-to-picker-quiet:var(--spectrum-field-label-to-component-quiet-large);--spectrum-picker-spacing-top-to-alert-icon:var(--spectrum-field-top-to-alert-icon-large);--spectrum-picker-spacing-top-to-progress-circle:var(--spectrum-field-top-to-progress-circle-large);--spectrum-picker-spacing-top-to-disclosure-icon:var(--spectrum-field-top-to-disclosure-icon-200);--spectrum-picker-spacing-edge-to-disclosure-icon:var(--spectrum-field-end-edge-to-disclosure-icon-200)}:host([size=xl]){--spectrum-picker-font-size:var(--spectrum-font-size-300);--spectrum-picker-block-size:var(--spectrum-component-height-300);--spectrum-picker-spacing-top-to-text-side-label-quiet:var(--spectrum-component-top-to-text-300);--spectrum-picker-spacing-top-to-text:var(--spectrum-component-top-to-text-300);--spectrum-picker-spacing-bottom-to-text:var(--spectrum-component-bottom-to-text-300);--spectrum-picker-spacing-edge-to-text:var(--spectrum-component-edge-to-text-300);--spectrum-picker-spacing-text-to-icon:var(--spectrum-text-to-visual-300);--spectrum-picker-spacing-text-to-icon-inline-end:var(--spectrum-field-text-to-alert-icon-extra-large);--spectrum-picker-spacing-icon-to-disclosure-icon:var(--spectrum-picker-visual-to-disclosure-icon-extra-large);--spectrum-picker-spacing-label-to-picker-quiet:var(--spectrum-field-label-to-component-quiet-extra-large);--spectrum-picker-spacing-top-to-alert-icon:var(--spectrum-field-top-to-alert-icon-extra-large);--spectrum-picker-spacing-top-to-progress-circle:var(--spectrum-field-top-to-progress-circle-extra-large);--spectrum-picker-spacing-top-to-disclosure-icon:var(--spectrum-field-top-to-disclosure-icon-300);--spectrum-picker-spacing-edge-to-disclosure-icon:var(--spectrum-field-end-edge-to-disclosure-icon-300)}@media (forced-colors:active){:host{--highcontrast-picker-focus-indicator-color:Highlight;--highcontrast-picker-border-color-default:ButtonBorder;--highcontrast-picker-border-color-hover:Highlight;--highcontrast-picker-border-color-disabled:GrayText;--highcontrast-picker-content-color-default:ButtonText;--highcontrast-picker-content-color-disabled:GrayText;--highcontrast-picker-background-color:ButtonFace}#button.is-keyboardFocused,#button:focus-visible{--highcontrast-picker-border-color-hover:ButtonText}#button .label,#button:after{forced-color-adjust:none}}#button{box-sizing:border-box;min-inline-size:calc(var(--spectrum-picker-minimum-width-multiplier)*var(--mod-picker-block-size,var(--spectrum-picker-block-size)));inline-size:var(--mod-picker-inline-size,var(--spectrum-picker-inline-size));block-size:var(--mod-picker-block-size,var(--spectrum-picker-block-size));border-width:var(--mod-picker-border-width,var(--spectrum-picker-border-width));border-radius:var(--mod-picker-border-radius,var(--spectrum-picker-border-radius));transition:background-color var(--mod-picker-animation-duration,var(--spectrum-picker-animation-duration)),box-shadow var(--mod-picker-animation-duration,var(--spectrum-picker-animation-duration)),border-color var(--mod-picker-animation-duration,var(--spectrum-picker-animation-duration))ease-in-out;color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-default,var(--spectrum-picker-font-color-default)));background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-default,var(--spectrum-picker-background-color-default)));border-style:solid;border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-default,var(--spectrum-picker-border-color-default)));max-inline-size:100%;margin-block-start:var(--mod-picker-spacing-label-to-picker,var(--spectrum-picker-spacing-label-to-picker));padding-block:0;padding-inline-start:var(--mod-picker-spacing-edge-to-text,var(--spectrum-picker-spacing-edge-to-text));padding-inline-end:var(--mod-picker-spacing-edge-to-disclosure-icon,var(--spectrum-picker-spacing-edge-to-disclosure-icon));display:flex}#button:after{pointer-events:none;content:"";block-size:calc(100% + var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap))*2 + var(--mod-picker-border-width,var(--spectrum-picker-border-width))*2);inline-size:calc(100% + var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap))*2 + var(--mod-picker-border-width,var(--spectrum-picker-border-width))*2);border-style:solid;border-width:var(--mod-picker-focus-indicator-thickness,var(--spectrum-picker-focus-indicator-thickness));border-radius:calc(var(--mod-picker-border-radius,var(--spectrum-picker-border-radius)) + var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap)) + var(--mod-picker-border-width,var(--spectrum-picker-border-width)));border-color:#0000;margin-block-start:calc(( var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap)) + var(--mod-picker-focus-indicator-thickness,var(--spectrum-picker-focus-indicator-thickness)) + var(--mod-picker-border-width,var(--spectrum-picker-border-width)))*-1);margin-inline-start:calc(( var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap)) + var(--mod-picker-focus-indicator-thickness,var(--spectrum-picker-focus-indicator-thickness)) + var(--mod-picker-border-width,var(--spectrum-picker-border-width)))*-1);position:absolute;inset-block:0;inset-inline:0}#button:active{background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-active,var(--spectrum-picker-background-color-active)));border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-active,var(--spectrum-picker-border-color-active)))}#button:active:after{border-color:#0000}#button.placeholder:active .label{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-active,var(--spectrum-picker-font-color-active)))}#button.is-keyboardFocused,#button:focus-visible{background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-key-focus,var(--spectrum-picker-background-color-key-focus)));border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-key-focus,var(--spectrum-picker-border-color-key-focus)));color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-key-focus,var(--spectrum-picker-font-color-key-focus)));outline:none}#button.is-keyboardFocused:after,#button:focus-visible:after{border-color:var(--highcontrast-picker-focus-indicator-color,var(--mod-picker-focus-indicator-color,var(--spectrum-picker-focus-indicator-color)))}#button.is-keyboardFocused.placeholder,#button.placeholder:focus-visible{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-key-focus,var(--spectrum-picker-font-color-key-focus)))}#button.is-keyboardFocused .picker,#button:focus-visible .picker{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-key-focus,var(--spectrum-picker-icon-color-key-focus)))}:host([invalid]) #button:not(:disabled):not(.is-disabled){border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-error-default,var(--spectrum-picker-border-color-error-default)))}:host([invalid]) #button:not(:disabled):not(.is-disabled) .validation-icon{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-error,var(--spectrum-picker-icon-color-error)))}:host([invalid]) #button:not(:disabled):not(.is-disabled):active{border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-error-active,var(--spectrum-picker-border-color-error-active)))}:host([invalid][open]) #button:not(:disabled):not(.is-disabled){border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-error-default-open,var(--spectrum-picker-border-color-error-default-open)))}:host([invalid]) #button.is-keyboardFocused:not(:disabled):not(.is-disabled),:host([invalid]) #button:not(:disabled):not(.is-disabled):focus-visible{border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-color-error-key-focus,var(--spectrum-picker-border-color-error-key-focus)))}:host([pending]) #button .picker{color:var(--highcontrast-picker-content-color-disabled,var(--mod-picker-icon-color-disabled,var(--spectrum-picker-icon-color-disabled)))}:host([invalid]) #button .label,:host([pending]) #button .label{margin-inline-end:var(--mod-picker-spacing-text-to-icon-inline-end,var(--mod-picker-spacing-text-to-alert-icon-inline-start,var(--spectrum-picker-spacing-text-to-icon-inline-end)))}:host([disabled]) #button,#button:disabled{cursor:default;background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-disabled,var(--spectrum-picker-background-color-disabled)));border-color:var(--highcontrast-picker-border-color-disabled,transparent);color:var(--highcontrast-picker-content-color-disabled,var(--mod-picker-font-color-disabled,var(--spectrum-picker-font-color-disabled)))}:host([disabled]) #button .icon,:host([disabled]) #button .picker,:host([disabled]) #button .validation-icon,#button:disabled .icon,#button:disabled .picker,#button:disabled .validation-icon{color:var(--highcontrast-picker-content-color-disabled,var(--mod-picker-icon-color-disabled,var(--spectrum-picker-icon-color-disabled)))}:host([disabled]) #button .label.placeholder,#button:disabled .label.placeholder{color:var(--highcontrast-picker-content-color-disabled,var(--mod-picker-font-color-disabled,var(--spectrum-picker-font-color-disabled)))}.icon{flex-shrink:0;margin-inline-end:var(--mod-picker-spacing-text-to-icon,var(--spectrum-picker-spacing-text-to-icon))}:host([open]:not([quiet])) #button{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-default-open,var(--spectrum-picker-font-color-default-open)));background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-default-open,var(--spectrum-picker-background-color-default-open)));border-color:var(--highcontrast-picker-border-color-default,var(--mod-picker-border-default-open,var(--spectrum-picker-border-color-default-open)))}:host([open]:not([quiet])) #button .picker{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-default-open,var(--spectrum-picker-icon-color-default-open)))}.label{white-space:nowrap;font-size:var(--mod-picker-font-size,var(--spectrum-picker-font-size));line-height:var(--mod-picker-line-height,var(--spectrum-picker-line-height));font-weight:var(--mod-picker-font-weight,var(--spectrum-picker-font-weight));text-overflow:ellipsis;text-align:start;flex:auto;margin-block-start:var(--mod-picker-spacing-top-to-text,var(--spectrum-picker-spacing-top-to-text));margin-block-end:calc(var(--mod-picker-spacing-bottom-to-text,var(--spectrum-picker-spacing-bottom-to-text)) - var(--mod-picker-border-width,var(--spectrum-picker-border-width)));overflow:hidden}.label.placeholder{font-weight:var(--mod-picker-placeholder-font-weight,var(--spectrum-picker-font-weight));font-style:var(--mod-picker-placeholder-font-style,var(--spectrum-picker-placeholder-font-style));transition:color var(--mod-picker-animation-duration,var(--spectrum-picker-animation-duration))ease-in-out;color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-default,var(--spectrum-picker-font-color-default)))}.label.placeholder:active{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-active,var(--spectrum-picker-font-color-active)))}.picker{vertical-align:top;transition:color var(--mod-picker-animation-duration,var(--spectrum-picker-animation-duration))ease-out;margin-inline-start:var(--mod-picker-spacing-icon-to-disclosure-icon,var(--spectrum-picker-spacing-icon-to-disclosure-icon));margin-block:var(--mod-picker-spacing-top-to-disclosure-icon,var(--spectrum-picker-spacing-top-to-disclosure-icon));color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-default,var(--spectrum-picker-icon-color-default)));flex-shrink:0;display:inline-block;position:relative}.picker:active{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-active,var(--spectrum-picker-icon-color-active)))}.validation-icon{margin-block-start:calc(var(--mod-picker-spacing-top-to-alert-icon,var(--spectrum-picker-spacing-top-to-alert-icon)) - var(--mod-picker-border-width,var(--spectrum-picker-border-width)));margin-block-end:calc(var(--mod-picker-spacing-top-to-alert-icon,var(--spectrum-picker-spacing-top-to-alert-icon)) - var(--mod-picker-border-width,var(--spectrum-picker-border-width)))}#button .progress-circle{margin-block-start:calc(var(--mod-picker-spacing-top-to-progress-circle,var(--spectrum-picker-spacing-top-to-progress-circle)) - var(--mod-picker-border-width,var(--spectrum-picker-border-width)));margin-block-end:calc(var(--mod-picker-spacing-top-to-progress-circle,var(--spectrum-picker-spacing-top-to-progress-circle)) - var(--mod-picker-border-width,var(--spectrum-picker-border-width)))}.label~.picker{margin-inline-start:var(--mod-picker-spacing-text-to-icon,var(--spectrum-picker-spacing-text-to-icon))}:host([quiet]) #button{padding-inline:var(--mod-picker-spacing-edge-to-text-quiet,var(--spectrum-picker-spacing-edge-to-text-quiet));color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-default,var(--spectrum-picker-font-color-default)));background-color:var(--highcontrast-picker-background-color,transparent);border:none;border-radius:0;inline-size:auto;min-inline-size:0;margin-block-start:calc(var(--mod-picker-spacing-label-to-picker-quiet,var(--spectrum-picker-spacing-label-to-picker-quiet)) + 1px)}:host([quiet]) #button.label-inline{margin-block-start:0}:host([quiet]) #button .picker{margin-inline-end:var(--mod-picker-spacing-edge-to-disclosure-icon-quiet,var(--spectrum-picker-spacing-edge-to-disclosure-icon-quiet))}:host([quiet]) #button:after{border:none;block-size:auto;inline-size:auto}@media (hover:hover){#button:hover{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-hover,var(--spectrum-picker-font-color-hover)));background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-hover,var(--spectrum-picker-background-color-hover)));border-color:var(--highcontrast-picker-border-color-hover,var(--mod-picker-border-color-hover,var(--spectrum-picker-border-color-hover)))}#button:hover .picker{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-hover,var(--spectrum-picker-icon-color-hover)))}:host([invalid]) #button:not(:disabled):not(.is-disabled):hover{border-color:var(--highcontrast-picker-border-color-hover,var(--mod-picker-border-color-error-hover,var(--spectrum-picker-border-color-error-hover)))}:host([invalid][open]) #button:not(:disabled):not(.is-disabled):hover{border-color:var(--highcontrast-picker-border-color-hover,var(--mod-picker-border-color-error-hover-open,var(--spectrum-picker-border-color-error-hover-open)))}:host([open]:not([quiet])) #button:hover{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-hover-open,var(--spectrum-picker-font-color-hover-open)));background-color:var(--highcontrast-picker-background-color,var(--mod-picker-background-color-hover-open,var(--spectrum-picker-background-color-hover-open)));border-color:var(--highcontrast-picker-border-color-hover,var(--mod-picker-border-color-hover-open,var(--spectrum-picker-border-color-hover-open)))}:host([open]:not([quiet])) #button:hover .picker{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-icon-color-hover-open,var(--spectrum-picker-icon-color-hover-open)))}.label.placeholder:hover{color:var(--highcontrast-picker-content-color-default,var(--mod-picker-font-color-hover,var(--spectrum-picker-font-color-hover)))}:host([quiet]) #button:hover{background-color:var(--highcontrast-picker-background-color,transparent)}}:host([quiet]) #button.is-keyboardFocused,:host([quiet]) #button:focus-visible{background-color:var(--highcontrast-picker-background-color,transparent)}:host([quiet]) #button.is-keyboardFocused:after,:host([quiet]) #button:focus-visible:after{box-shadow:0 var(--mod-picker-focus-indicator-thickness,var(--spectrum-picker-focus-indicator-thickness))0 0 var(--highcontrast-picker-focus-indicator-color,var(--mod-picker-focus-indicator-color,var(--spectrum-picker-focus-indicator-color)));margin:calc(( var(--mod-picker-focus-indicator-gap,var(--spectrum-picker-focus-indicator-gap)) + var(--mod-picker-border-width,var(--spectrum-picker-border-width)))*-1)0;border:none;border-radius:0}:host([quiet][disabled]) #button,:host([quiet][open]) #button,:host([quiet]) #button:active,:host([quiet]) #button:disabled{background-color:var(--highcontrast-picker-background-color,transparent)}.label-inline{vertical-align:top;display:inline-flex}:host{--spectrum-picker-background-color-default:var(--system-spectrum-picker-background-color-default);--spectrum-picker-background-color-default-open:var(--system-spectrum-picker-background-color-default-open);--spectrum-picker-background-color-active:var(--system-spectrum-picker-background-color-active);--spectrum-picker-background-color-hover:var(--system-spectrum-picker-background-color-hover);--spectrum-picker-background-color-hover-open:var(--system-spectrum-picker-background-color-hover-open);--spectrum-picker-background-color-key-focus:var(--system-spectrum-picker-background-color-key-focus);--spectrum-picker-border-color-default:var(--system-spectrum-picker-border-color-default);--spectrum-picker-border-color-default-open:var(--system-spectrum-picker-border-color-default-open);--spectrum-picker-border-color-hover:var(--system-spectrum-picker-border-color-hover);--spectrum-picker-border-color-hover-open:var(--system-spectrum-picker-border-color-hover-open);--spectrum-picker-border-color-active:var(--system-spectrum-picker-border-color-active);--spectrum-picker-border-color-key-focus:var(--system-spectrum-picker-border-color-key-focus);--spectrum-picker-border-width:var(--system-spectrum-picker-border-width)}:host{vertical-align:top;inline-size:var(--mod-picker-inline-size,var(--spectrum-picker-inline-size));min-inline-size:calc(var(--spectrum-picker-minimum-width-multiplier)*var(--mod-picker-block-size,var(--spectrum-picker-block-size)));max-inline-size:100%;display:inline-flex}:host([quiet]){width:auto;min-width:0}:host([disabled]){pointer-events:none}#button{width:100%;min-width:100%;max-width:100%}#icon:not([hidden]){display:inline-flex}:host([readonly]) #button{user-select:inherit}.picker,.validation-icon{flex-shrink:0}sp-overlay{pointer-events:none}sp-menu{pointer-events:initial}:host>sp-menu{display:none}:host([focused]:not([quiet])) #button #label.placeholder{color:var(--spectrum-picker-placeholder-text-color-key-focus,var(--spectrum-alias-placeholder-text-color-hover))}#label.visually-hidden~.picker{margin-inline-start:auto}:host([focused]:not([quiet],[pending])) #button .picker{color:var(--spectrum-picker-icon-color-key-focus,var(--spectrum-alias-icon-color-focus))}.visually-hidden{clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:0 -1px -1px 0;padding:0;position:absolute;overflow:hidden}sp-overlay:not(:defined){display:none}
`;
var picker_css_default = o25;

// ../node_modules/@spectrum-web-components/picker/src/Picker.js
init_focusable();
init_MatchMedia();
var b5 = Object.defineProperty;
var f7 = Object.getOwnPropertyDescriptor;
var n17 = (d13, a10, e22, t16) => {
  for (var i20 = t16 > 1 ? void 0 : t16 ? f7(a10, e22) : a10, o26 = d13.length - 1, r16; o26 >= 0; o26--) (r16 = d13[o26]) && (i20 = (t16 ? r16(a10, e22, i20) : r16(i20)) || i20);
  return t16 && i20 && b5(a10, e22, i20), i20;
};
var x3 = { s: "spectrum-UIIcon-ChevronDown75", m: "spectrum-UIIcon-ChevronDown100", l: "spectrum-UIIcon-ChevronDown200", xl: "spectrum-UIIcon-ChevronDown300" };
var DESCRIPTION_ID = "option-picker";
var PickerBase = class extends SizedMixin(Focusable, { noDefaultSize: true }) {
  constructor() {
    super(...arguments);
    this.isMobile = new MatchMediaController(this, IS_MOBILE);
    this.dependencyManager = new DependencyManagerController(this);
    this.deprecatedMenu = null;
    this.disabled = false;
    this.focused = false;
    this.invalid = false;
    this.pending = false;
    this.pendingLabel = "Pending";
    this.open = false;
    this.readonly = false;
    this.selects = "single";
    this.placement = "bottom-start";
    this.quiet = false;
    this.value = "";
    this.listRole = "listbox";
    this.itemRole = "option";
    this.preventNextToggle = "no";
    this.pointerdownState = false;
    this.handleKeydown = (e22) => {
      this.focused = true, !(e22.code !== "ArrowDown" && e22.code !== "ArrowUp") && (e22.stopPropagation(), e22.preventDefault(), this.toggle(true));
    };
    this.handleSlottableRequest = (e22) => {
    };
    this.applyFocusElementLabel = (e22, t16) => {
      this.appliedLabel = e22, this.labelAlignment = t16.sideAligned ? "inline" : void 0;
    };
    this.hasRenderedOverlay = false;
    this.willManageSelection = false;
    this.selectionPromise = Promise.resolve();
    this.recentlyConnected = false;
    this.enterKeydownOn = null;
    this.handleEnterKeydown = (e22) => {
      if (e22.code === "Enter") {
        if (this.enterKeydownOn) {
          e22.preventDefault();
          return;
        }
        this.enterKeydownOn = e22.target, this.addEventListener("keyup", async (t16) => {
          t16.code === "Enter" && (this.enterKeydownOn = null);
        }, { once: true });
      }
    };
  }
  get menuItems() {
    return this.optionsMenu.childItems;
  }
  get selectedItem() {
    return this._selectedItem;
  }
  set selectedItem(e22) {
    if (this.selectedItemContent = e22 ? e22.itemChildren : void 0, e22 === this.selectedItem) return;
    const t16 = this.selectedItem;
    this._selectedItem = e22, this.requestUpdate("selectedItem", t16);
  }
  get focusElement() {
    return this.open ? this.optionsMenu : this.button;
  }
  forceFocusVisible() {
    this.disabled || (this.focused = true);
  }
  click() {
    this.disabled || this.toggle();
  }
  handleButtonBlur() {
    this.focused = false;
  }
  handleButtonPointerdown(e22) {
    if (e22.button !== 0) return;
    this.pointerdownState = this.open, this.preventNextToggle = "maybe";
    let t16 = 0;
    const i20 = () => {
      cancelAnimationFrame(t16), t16 = requestAnimationFrame(async () => {
        document.removeEventListener("pointerup", i20), document.removeEventListener("pointercancel", i20), this.button.removeEventListener("click", i20), requestAnimationFrame(() => {
          this.preventNextToggle = "no";
        });
      });
    };
    document.addEventListener("pointerup", i20), document.addEventListener("pointercancel", i20), this.button.addEventListener("click", i20), this.handleActivate();
  }
  handleButtonFocus(e22) {
    this.preventNextToggle === "maybe" && e22.relatedTarget === this.optionsMenu && (this.preventNextToggle = "yes");
  }
  handleActivate(e22) {
    this.enterKeydownOn && this.enterKeydownOn !== this.button || this.preventNextToggle !== "yes" && ((e22 == null ? void 0 : e22.type) === "click" && this.open !== this.pointerdownState || this.toggle());
  }
  focus(e22) {
    super.focus(e22), !this.disabled && this.focusElement && (this.focused = this.hasVisibleFocusInTree());
  }
  handleHelperFocus() {
    this.focused = true, this.button.focus();
  }
  handleChange(e22) {
    this.preventNextToggle = "no";
    const t16 = e22.target, [i20] = t16.selectedItems;
    e22.stopPropagation(), e22.cancelable ? this.setValueFromItem(i20, e22) : this.open = false;
  }
  async setValueFromItem(e22, t16) {
    var h11;
    this.open = false;
    const i20 = this.selectedItem, o26 = this.value;
    if (this.selectedItem = e22, this.value = (h11 = e22 == null ? void 0 : e22.value) != null ? h11 : "", await this.updateComplete, !this.dispatchEvent(new Event("change", { bubbles: true, cancelable: true, composed: true })) && this.selects) {
      t16 && t16.preventDefault(), this.setMenuItemSelected(this.selectedItem, false), i20 && this.setMenuItemSelected(i20, true), this.selectedItem = i20, this.value = o26, this.open = true;
      return;
    } else if (!this.selects) {
      this.selectedItem = i20, this.value = o26;
      return;
    }
    i20 && this.setMenuItemSelected(i20, false), this.setMenuItemSelected(e22, !!this.selects);
  }
  setMenuItemSelected(e22, t16) {
    this.selects != null && (e22.selected = t16);
  }
  toggle(e22) {
    this.readonly || this.pending || (this.open = typeof e22 != "undefined" ? e22 : !this.open);
  }
  close() {
    this.readonly || (this.open = false);
  }
  get containerStyles() {
    return this.isMobile.matches ? { "--swc-menu-width": "100%" } : {};
  }
  get selectedItemContent() {
    return this._selectedItemContent || { icon: [], content: [] };
  }
  set selectedItemContent(e22) {
    if (e22 === this.selectedItemContent) return;
    const t16 = this.selectedItemContent;
    this._selectedItemContent = e22, this.requestUpdate("selectedItemContent", t16);
  }
  handleTooltipSlotchange(e22) {
    this.tooltipEl = e22.target.assignedElements()[0];
  }
  handleBeforetoggle(e22) {
    e22.composedPath()[0] === e22.target && (e22.newState === "closed" && (this.preventNextToggle === "no" ? this.open = false : this.pointerdownState || this.overlayElement.manuallyKeepOpen()), this.open || (this.optionsMenu.updateSelectedItemIndex(), this.optionsMenu.closeDescendentOverlays()));
  }
  renderLabelContent(e22) {
    return this.value && this.selectedItem ? e22 : x`
            <slot name="label" id="label">
                <span
                    aria-hidden=${l6(this.appliedLabel ? void 0 : "true")}
                >
                    ${this.label}
                </span>
            </slot>
        `;
  }
  get buttonContent() {
    const e22 = { "visually-hidden": this.icons === "only" && !!this.value, placeholder: !this.value, label: true }, t16 = this.appliedLabel || this.label;
    return [x`
                <span id="icon" ?hidden=${this.icons === "none"}>
                    ${this.selectedItemContent.icon}
                </span>
                <span
                    id=${l6(this.value && this.selectedItem ? "label" : void 0)}
                    class=${o9(e22)}
                >
                    ${this.renderLabelContent(this.selectedItemContent.content)}
                </span>
                ${this.value && this.selectedItem ? x`
                          <span
                              aria-hidden="true"
                              class="visually-hidden"
                              id="applied-label"
                          >
                              ${t16}
                              <slot name="label"></slot>
                          </span>
                      ` : x`
                          <span hidden id="applied-label">${t16}</span>
                      `}
                ${this.invalid && !this.pending ? x`
                          <sp-icon-alert
                              class="validation-icon"
                          ></sp-icon-alert>
                      ` : A}
                ${n12(this.pending, () => (Promise.resolve().then(() => init_sp_progress_circle()), x`
                        <sp-progress-circle
                            id="loader"
                            size="s"
                            indeterminate
                            aria-valuetext=${this.pendingLabel}
                            class="progress-circle"
                        ></sp-progress-circle>
                    `))}
                <sp-icon-chevron100
                    class="picker ${x3[this.size]}"
                ></sp-icon-chevron100>
                <slot
                    aria-hidden="true"
                    name="tooltip"
                    id="tooltip"
                    @slotchange=${this.handleTooltipSlotchange}
                ></slot>
            `];
  }
  renderOverlay(e22) {
    const t16 = this.renderContainer(e22);
    return this.dependencyManager.add("sp-overlay"), Promise.resolve().then(() => init_sp_overlay()), x`
            <sp-overlay
                @slottable-request=${this.handleSlottableRequest}
                @beforetoggle=${this.handleBeforetoggle}
                .triggerElement=${this}
                .offset=${0}
                ?open=${this.open && this.dependencyManager.loaded}
                .placement=${this.isMobile.matches ? void 0 : this.placement}
                .type=${this.isMobile.matches ? "modal" : "auto"}
                .receivesFocus=${"true"}
                .willPreventClose=${this.preventNextToggle !== "no" && this.open && this.dependencyManager.loaded}
            >
                ${t16}
            </sp-overlay>
        `;
  }
  get renderDescriptionSlot() {
    return x`
            <div id=${DESCRIPTION_ID}>
                <slot name="description"></slot>
            </div>
        `;
  }
  render() {
    return this.tooltipEl && (this.tooltipEl.disabled = this.open), x`
            <span
                id="focus-helper"
                tabindex="${this.focused || this.open ? "-1" : "0"}"
                @focus=${this.handleHelperFocus}
                aria-describedby=${DESCRIPTION_ID}
            ></span>
            <button
                aria-controls=${l6(this.open ? "menu" : void 0)}
                aria-describedby="tooltip"
                aria-expanded=${this.open ? "true" : "false"}
                aria-haspopup="true"
                aria-labelledby="loader icon label applied-label"
                id="button"
                class=${l6(this.labelAlignment ? `label-${this.labelAlignment}` : void 0)}
                @blur=${this.handleButtonBlur}
                @click=${this.handleActivate}
                @pointerdown=${this.handleButtonPointerdown}
                @focus=${this.handleButtonFocus}
                @keydown=${{ handleEvent: this.handleEnterKeydown, capture: true }}
                ?disabled=${this.disabled}
                tabindex="-1"
            >
                ${this.buttonContent}
            </button>
            ${this.renderMenu} ${this.renderDescriptionSlot}
        `;
  }
  update(e22) {
    var t16, i20;
    this.selects && (this.selects = "single"), e22.has("disabled") && this.disabled && (this.open = false), e22.has("pending") && this.pending && (this.open = false), e22.has("value") && this.shouldScheduleManageSelection(), this.hasUpdated || (this.deprecatedMenu = this.querySelector(":scope > sp-menu"), (t16 = this.deprecatedMenu) == null || t16.toggleAttribute("ignore", true), (i20 = this.deprecatedMenu) == null || i20.setAttribute("selects", "inherit")), super.update(e22);
  }
  bindButtonKeydownListener() {
    this.button.addEventListener("keydown", this.handleKeydown);
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.bindButtonKeydownListener();
  }
  get dismissHelper() {
    return x`
            <div class="visually-hidden">
                <button
                    tabindex="-1"
                    aria-label="Dismiss"
                    @click=${this.close}
                ></button>
            </div>
        `;
  }
  renderContainer(e22) {
    const t16 = x`
            ${this.dismissHelper} ${e22} ${this.dismissHelper}
        `;
    return this.isMobile.matches ? (this.dependencyManager.add("sp-tray"), Promise.resolve().then(() => init_sp_tray()), x`
                <sp-tray
                    id="popover"
                    role="presentation"
                    style=${o10(this.containerStyles)}
                >
                    ${t16}
                </sp-tray>
            `) : (this.dependencyManager.add("sp-popover"), Promise.resolve().then(() => init_sp_popover()), x`
            <sp-popover
                id="popover"
                role="presentation"
                style=${o10(this.containerStyles)}
                placement=${this.placement}
            >
                ${t16}
            </sp-popover>
        `);
  }
  get renderMenu() {
    const e22 = x`
            <sp-menu
                aria-labelledby="applied-label"
                @change=${this.handleChange}
                id="menu"
                @keydown=${{ handleEvent: this.handleEnterKeydown, capture: true }}
                role=${this.listRole}
                .selects=${this.selects}
                .selected=${this.value ? [this.value] : []}
                size=${this.size}
                @sp-menu-item-added-or-updated=${this.shouldManageSelection}
            >
                <slot @slotchange=${this.shouldScheduleManageSelection}></slot>
            </sp-menu>
        `;
    return this.hasRenderedOverlay = this.hasRenderedOverlay || this.focused || this.open || !!this.deprecatedMenu, this.hasRenderedOverlay ? this.renderOverlay(e22) : e22;
  }
  shouldScheduleManageSelection(e22) {
    !this.willManageSelection && (!e22 || e22.target.getRootNode().host === this) && (this.willManageSelection = true, requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.manageSelection();
      });
    }));
  }
  shouldManageSelection() {
    this.willManageSelection || (this.willManageSelection = true, this.manageSelection());
  }
  async manageSelection() {
    if (this.selects == null) return;
    this.selectionPromise = new Promise((t16) => this.selectionResolver = t16);
    let e22;
    await this.optionsMenu.updateComplete, this.recentlyConnected && (await new Promise((t16) => requestAnimationFrame(() => t16(true))), this.recentlyConnected = false), this.menuItems.forEach((t16) => {
      this.value === t16.value && !t16.disabled ? e22 = t16 : t16.selected = false;
    }), e22 ? (e22.selected = !!this.selects, this.selectedItem = e22) : (this.value = "", this.selectedItem = void 0), this.open && (await this.optionsMenu.updateComplete, this.optionsMenu.updateSelectedItemIndex()), this.selectionResolver(), this.willManageSelection = false;
  }
  async getUpdateComplete() {
    const e22 = await super.getUpdateComplete();
    return await this.selectionPromise, this.overlayElement && await this.overlayElement.updateComplete, e22;
  }
  connectedCallback() {
    super.connectedCallback(), this.recentlyConnected = this.hasUpdated;
  }
  disconnectedCallback() {
    this.close(), super.disconnectedCallback();
  }
};
n17([t4()], PickerBase.prototype, "appliedLabel", 2), n17([i5("#button")], PickerBase.prototype, "button", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "disabled", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "focused", 2), n17([n7({ type: String, reflect: true })], PickerBase.prototype, "icons", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "invalid", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "pending", 2), n17([n7({ type: String, attribute: "pending-label" })], PickerBase.prototype, "pendingLabel", 2), n17([n7()], PickerBase.prototype, "label", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "open", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "readonly", 2), n17([t4()], PickerBase.prototype, "labelAlignment", 2), n17([i5("sp-menu")], PickerBase.prototype, "optionsMenu", 2), n17([i5("sp-overlay")], PickerBase.prototype, "overlayElement", 2), n17([n7()], PickerBase.prototype, "placement", 2), n17([n7({ type: Boolean, reflect: true })], PickerBase.prototype, "quiet", 2), n17([n7({ type: String })], PickerBase.prototype, "value", 2), n17([n7({ attribute: false })], PickerBase.prototype, "selectedItem", 1), n17([t4()], PickerBase.prototype, "selectedItemContent", 1);
var Picker = class extends PickerBase {
  constructor() {
    super(...arguments);
    this.handleKeydown = (e22) => {
      const { code: t16 } = e22;
      if (this.focused = true, !t16.startsWith("Arrow") || this.readonly || this.pending) return;
      if (t16 === "ArrowUp" || t16 === "ArrowDown") {
        this.toggle(true), e22.preventDefault();
        return;
      }
      e22.preventDefault();
      const i20 = this.selectedItem ? this.menuItems.indexOf(this.selectedItem) : -1, o26 = i20 < 0 || t16 === "ArrowRight" ? 1 : -1;
      let r16 = i20 + o26;
      for (; this.menuItems[r16] && this.menuItems[r16].disabled; ) r16 += o26;
      !this.menuItems[r16] || this.menuItems[r16].disabled || (!this.value || r16 !== i20) && this.setValueFromItem(this.menuItems[r16]);
    };
  }
  static get styles() {
    return [picker_css_default, spectrum_icon_chevron_css_default];
  }
  get containerStyles() {
    const e22 = super.containerStyles;
    return this.quiet || (e22["min-width"] = `${this.offsetWidth}px`), e22;
  }
};

// ../node_modules/@spectrum-web-components/picker/sp-picker.js
init_define_element();
defineElement("sp-picker", Picker);

// ../node_modules/@spectrum-web-components/search/src/Search.js
init_src();
init_decorators2();
init_directives();

// ../node_modules/@spectrum-web-components/textfield/src/Textfield.js
init_src();
init_directives();
init_decorators2();

// ../node_modules/@spectrum-web-components/textfield/node_modules/@spectrum-web-components/help-text/src/HelpTextManager.js
init_src();
init_directives();
init_condition_attribute_with_id();
init_random_id();
var HelpTextManager = class {
  constructor(e22, { mode: i20 } = { mode: "internal" }) {
    this.mode = "internal";
    this.handleSlotchange = ({ target: e23 }) => {
      this.handleHelpText(e23), this.handleNegativeHelpText(e23);
    };
    this.host = e22, this.id = `sp-help-text-${randomID()}`, this.mode = i20;
  }
  get isInternal() {
    return this.mode === "internal";
  }
  render(e22) {
    return x`
            <div id=${l6(this.isInternal ? this.id : void 0)}>
                <slot
                    name=${e22 ? "negative-help-text" : `pass-through-help-text-${randomID()}`}
                    @slotchange=${this.handleSlotchange}
                >
                    <slot name="help-text"></slot>
                </slot>
            </div>
        `;
  }
  addId() {
    const e22 = this.helpTextElement ? this.helpTextElement.id : this.id;
    this.conditionId = conditionAttributeWithId(this.host, "aria-describedby", e22), this.host.hasAttribute("tabindex") && (this.previousTabindex = parseFloat(this.host.getAttribute("tabindex"))), this.host.tabIndex = 0;
  }
  removeId() {
    this.conditionId && (this.conditionId(), delete this.conditionId), !this.helpTextElement && (this.previousTabindex ? this.host.tabIndex = this.previousTabindex : this.host.removeAttribute("tabindex"));
  }
  handleHelpText(e22) {
    if (this.isInternal) return;
    this.helpTextElement && this.helpTextElement.id === this.id && this.helpTextElement.removeAttribute("id"), this.removeId();
    const t16 = e22.assignedElements()[0];
    this.helpTextElement = t16, t16 && (t16.id || (t16.id = this.id), this.addId());
  }
  handleNegativeHelpText(e22) {
    if (e22.name !== "negative-help-text") return;
    e22.assignedElements().forEach((t16) => t16.variant = "negative");
  }
};

// ../node_modules/@spectrum-web-components/textfield/node_modules/@spectrum-web-components/help-text/src/manage-help-text.js
function ManageHelpText(e22, { mode: t16 } = { mode: "internal" }) {
  class n18 extends e22 {
    constructor() {
      super(...arguments);
      this.helpTextManager = new HelpTextManager(this, { mode: t16 });
    }
    get helpTextId() {
      return this.helpTextManager.id;
    }
    renderHelpText(r16) {
      return this.helpTextManager.render(r16);
    }
  }
  return n18;
}

// ../node_modules/@spectrum-web-components/textfield/src/Textfield.js
init_focusable();

// ../node_modules/@spectrum-web-components/textfield/src/textfield.css.js
init_src();
var t14 = i3`
    :host{--spectrum-textfield-input-line-height:var(--spectrum-textfield-height);--spectrum-texfield-animation-duration:var(--spectrum-animation-duration-100);--spectrum-textfield-width:240px;--spectrum-textfield-min-width:var(--spectrum-text-field-minimum-width-multiplier);--spectrum-textfield-corner-radius:var(--spectrum-corner-radius-100);--spectrum-textfield-height:var(--spectrum-component-height-100);--spectrum-textfield-spacing-inline:var(--spectrum-component-edge-to-text-100);--spectrum-textfield-spacing-inline-quiet:var(--spectrum-field-edge-to-text-quiet);--spectrum-textfield-spacing-block-start:var(--spectrum-component-top-to-text-100);--spectrum-textfield-spacing-block-end:var(--spectrum-component-bottom-to-text-100);--spectrum-textfield-spacing-block-quiet:var(--spectrum-field-edge-to-border-quiet);--spectrum-textfield-label-spacing-block:var(--spectrum-field-label-to-component);--spectrum-textfield-label-spacing-block-quiet:var(--spectrum-field-label-to-component-quiet-medium);--spectrum-textfield-label-spacing-inline-side-label:var(--spectrum-spacing-100);--spectrum-textfield-helptext-spacing-block:var(--spectrum-help-text-to-component);--spectrum-textfield-icon-size-invalid:var(--spectrum-workflow-icon-size-100);--spectrum-textfield-icon-size-valid:var(--spectrum-checkmark-icon-size-100);--spectrum-textfield-icon-spacing-inline-start-invalid:var(--spectrum-field-text-to-alert-icon-medium);--spectrum-textfield-icon-spacing-inline-end-invalid:var(--spectrum-field-edge-to-alert-icon-medium);--spectrum-textfield-icon-spacing-inline-end-quiet-invalid:var(--spectrum-field-edge-to-alert-icon-quiet);--spectrum-textfield-icon-spacing-block-invalid:var(--spectrum-field-top-to-alert-icon-medium);--spectrum-textfield-icon-spacing-inline-start-valid:var(--spectrum-field-text-to-validation-icon-medium);--spectrum-textfield-icon-spacing-inline-end-valid:var(--spectrum-field-edge-to-validation-icon-medium);--spectrum-textfield-icon-spacing-inline-end-quiet-valid:var(--spectrum-field-edge-to-validation-icon-quiet);--spectrum-textfield-icon-spacing-block-valid:var(--spectrum-field-top-to-validation-icon-medium);--spectrum-textfield-font-family:var(--spectrum-sans-font-family-stack);--spectrum-textfield-font-weight:var(--spectrum-regular-font-weight);--spectrum-textfield-placeholder-font-size:var(--spectrum-font-size-100);--spectrum-textfield-character-count-font-family:var(--spectrum-sans-font-family-stack);--spectrum-textfield-character-count-font-weight:var(--spectrum-regular-font-weight);--spectrum-textfield-character-count-font-size:var(--spectrum-font-size-75);--spectrum-textfield-character-count-spacing-inline:var(--spectrum-spacing-200);--spectrum-textfield-character-count-spacing-block:var(--spectrum-component-bottom-to-text-75);--spectrum-textfield-character-count-spacing-inline-side:var(--spectrum-side-label-character-count-to-field);--spectrum-textfield-character-count-spacing-block-side:var(--spectrum-side-label-character-count-top-margin-medium);--spectrum-textfield-focus-indicator-width:var(--spectrum-focus-indicator-thickness);--spectrum-textfield-focus-indicator-gap:var(--spectrum-focus-indicator-gap);--spectrum-textfield-background-color:var(--spectrum-gray-50);--spectrum-textfield-text-color-default:var(--spectrum-neutral-content-color-default);--spectrum-textfield-text-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-textfield-text-color-focus:var(--spectrum-neutral-content-color-focus);--spectrum-textfield-text-color-focus-hover:var(--spectrum-neutral-content-color-focus-hover);--spectrum-textfield-text-color-keyboard-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-textfield-text-color-readonly:var(--spectrum-neutral-content-color-default);--spectrum-textfield-background-color-disabled:var(--spectrum-disabled-background-color);--spectrum-textfield-border-color-disabled:var(--spectrum-disabled-border-color);--spectrum-textfield-text-color-disabled:var(--spectrum-disabled-content-color);--spectrum-textfield-border-color-invalid-default:var(--spectrum-negative-border-color-default);--spectrum-textfield-border-color-invalid-hover:var(--spectrum-negative-border-color-hover);--spectrum-textfield-border-color-invalid-focus:var(--spectrum-negative-border-color-focus);--spectrum-textfield-border-color-invalid-focus-hover:var(--spectrum-negative-border-color-focus-hover);--spectrum-textfield-border-color-invalid-keyboard-focus:var(--spectrum-negative-border-color-key-focus);--spectrum-textfield-icon-color-invalid:var(--spectrum-negative-visual-color);--spectrum-textfield-text-color-invalid:var(--spectrum-neutral-content-color-default);--spectrum-textfield-text-color-valid:var(--spectrum-neutral-content-color-default);--spectrum-textfield-icon-color-valid:var(--spectrum-positive-visual-color);--spectrum-textfield-focus-indicator-color:var(--spectrum-focus-indicator-color);--spectrum-text-area-min-inline-size:var(--spectrum-text-area-minimum-width);--spectrum-text-area-min-block-size:var(--spectrum-text-area-minimum-height);--spectrum-text-area-min-block-size-quiet:var(--spectrum-component-height-100)}:host([size=s]){--spectrum-textfield-height:var(--spectrum-component-height-75);--spectrum-textfield-label-spacing-block-quiet:var(--spectrum-field-label-to-component-quiet-small);--spectrum-textfield-label-spacing-inline-side-label:var(--spectrum-spacing-100);--spectrum-textfield-placeholder-font-size:var(--spectrum-font-size-75);--spectrum-textfield-spacing-inline:var(--spectrum-component-edge-to-text-75);--spectrum-textfield-icon-size-invalid:var(--spectrum-workflow-icon-size-75);--spectrum-textfield-icon-size-valid:var(--spectrum-checkmark-icon-size-75);--spectrum-textfield-icon-spacing-inline-end-invalid:var(--spectrum-field-edge-to-alert-icon-small);--spectrum-textfield-icon-spacing-inline-end-valid:var(--spectrum-field-edge-to-validation-icon-small);--spectrum-textfield-icon-spacing-block-invalid:var(--spectrum-field-top-to-alert-icon-small);--spectrum-textfield-icon-spacing-block-valid:var(--spectrum-field-top-to-validation-icon-small);--spectrum-textfield-icon-spacing-inline-start-invalid:var(--spectrum-field-text-to-alert-icon-small);--spectrum-textfield-icon-spacing-inline-start-valid:var(--spectrum-field-text-to-validation-icon-small);--spectrum-textfield-character-count-font-size:var(--spectrum-font-size-75);--spectrum-textfield-character-count-spacing-block:var(--spectrum-component-bottom-to-text-75);--spectrum-textfield-character-count-spacing-block-quiet:var(--spectrum-character-count-to-field-quiet-small);--spectrum-textfield-character-count-spacing-block-side:var(--spectrum-side-label-character-count-top-margin-small);--spectrum-text-area-min-block-size-quiet:var(--spectrum-component-height-75)}:host{--spectrum-textfield-height:var(--spectrum-component-height-100);--spectrum-textfield-label-spacing-block-quiet:var(--spectrum-field-label-to-component-quiet-medium);--spectrum-textfield-label-spacing-inline-side-label:var(--spectrum-spacing-200);--spectrum-textfield-placeholder-font-size:var(--spectrum-font-size-100);--spectrum-textfield-spacing-inline:var(--spectrum-component-edge-to-text-100);--spectrum-textfield-icon-size-invalid:var(--spectrum-workflow-icon-size-100);--spectrum-textfield-icon-size-valid:var(--spectrum-checkmark-icon-size-100);--spectrum-textfield-icon-spacing-inline-end-invalid:var(--spectrum-field-edge-to-alert-icon-medium);--spectrum-textfield-icon-spacing-inline-end-valid:var(--spectrum-field-edge-to-validation-icon-medium);--spectrum-textfield-icon-spacing-block-invalid:var(--spectrum-field-top-to-alert-icon-medium);--spectrum-textfield-icon-spacing-block-valid:var(--spectrum-field-top-to-validation-icon-medium);--spectrum-textfield-icon-spacing-inline-start-invalid:var(--spectrum-field-text-to-alert-icon-medium);--spectrum-textfield-icon-spacing-inline-start-valid:var(--spectrum-field-text-to-validation-icon-medium);--spectrum-textfield-character-count-font-size:var(--spectrum-font-size-75);--spectrum-textfield-character-count-spacing-block:var(--spectrum-component-bottom-to-text-75);--spectrum-textfield-character-count-spacing-block-quiet:var(--spectrum-character-count-to-field-quiet-medium);--spectrum-textfield-character-count-spacing-block-side:var(--spectrum-side-label-character-count-top-margin-medium);--spectrum-text-area-min-block-size-quiet:var(--spectrum-component-height-100)}:host([size=l]){--spectrum-textfield-height:var(--spectrum-component-height-200);--spectrum-textfield-label-spacing-block-quiet:var(--spectrum-field-label-to-component-quiet-large);--spectrum-textfield-label-spacing-inline-side-label:var(--spectrum-spacing-200);--spectrum-textfield-placeholder-font-size:var(--spectrum-font-size-200);--spectrum-textfield-spacing-inline:var(--spectrum-component-edge-to-text-200);--spectrum-textfield-icon-size-invalid:var(--spectrum-workflow-icon-size-200);--spectrum-textfield-icon-size-valid:var(--spectrum-checkmark-icon-size-200);--spectrum-textfield-icon-spacing-inline-end-invalid:var(--spectrum-field-edge-to-alert-icon-large);--spectrum-textfield-icon-spacing-inline-end-valid:var(--spectrum-field-edge-to-validation-icon-large);--spectrum-textfield-icon-spacing-block-invalid:var(--spectrum-field-top-to-alert-icon-large);--spectrum-textfield-icon-spacing-block-valid:var(--spectrum-field-top-to-validation-icon-large);--spectrum-textfield-icon-spacing-inline-start-invalid:var(--spectrum-field-text-to-alert-icon-large);--spectrum-textfield-icon-spacing-inline-start-valid:var(--spectrum-field-text-to-validation-icon-large);--spectrum-textfield-character-count-font-size:var(--spectrum-font-size-100);--spectrum-textfield-character-count-spacing-block:var(--spectrum-component-bottom-to-text-100);--spectrum-textfield-character-count-spacing-block-quiet:var(--spectrum-character-count-to-field-quiet-large);--spectrum-textfield-character-count-spacing-block-side:var(--spectrum-side-label-character-count-top-margin-large);--spectrum-text-area-min-block-size-quiet:var(--spectrum-component-height-200)}:host([size=xl]){--spectrum-textfield-height:var(--spectrum-component-height-300);--spectrum-textfield-label-spacing-block-quiet:var(--spectrum-field-label-to-component-quiet-extra-large);--spectrum-textfield-label-spacing-inline-side-label:var(--spectrum-spacing-200);--spectrum-textfield-placeholder-font-size:var(--spectrum-font-size-300);--spectrum-textfield-spacing-inline:var(--spectrum-component-edge-to-text-200);--spectrum-textfield-icon-size-invalid:var(--spectrum-workflow-icon-size-300);--spectrum-textfield-icon-size-valid:var(--spectrum-checkmark-icon-size-300);--spectrum-textfield-icon-spacing-inline-end-invalid:var(--spectrum-field-edge-to-alert-icon-extra-large);--spectrum-textfield-icon-spacing-inline-end-valid:var(--spectrum-field-edge-to-validation-icon-extra-large);--spectrum-textfield-icon-spacing-block-invalid:var(--spectrum-field-top-to-alert-icon-extra-large);--spectrum-textfield-icon-spacing-block-valid:var(--spectrum-field-top-to-validation-icon-extra-large);--spectrum-textfield-icon-spacing-inline-start-invalid:var(--spectrum-field-text-to-alert-icon-extra-large);--spectrum-textfield-icon-spacing-inline-start-valid:var(--spectrum-field-text-to-validation-icon-extra-large);--spectrum-textfield-character-count-font-size:var(--spectrum-font-size-200);--spectrum-textfield-character-count-spacing-block:var(--spectrum-component-bottom-to-text-200);--spectrum-textfield-character-count-spacing-block-quiet:var(--spectrum-character-count-to-field-quiet-extra-large);--spectrum-textfield-character-count-spacing-block-side:var(--spectrum-side-label-character-count-top-margin-extra-large);--spectrum-text-area-min-block-size-quiet:var(--spectrum-component-height-300)}#textfield{inline-size:var(--mod-textfield-width,var(--spectrum-textfield-width));text-indent:0;appearance:textfield;text-overflow:ellipsis;grid-template-rows:auto auto auto;grid-template-columns:auto auto;margin:0;display:inline-grid;position:relative;overflow:visible}:host([quiet]) #textfield:after{content:"";block-size:var(--mod-textfield-focus-indicator-width,var(--spectrum-textfield-focus-indicator-width));inline-size:100%;position:absolute;inset-block-end:calc(( var(--mod-textfield-focus-indicator-gap,var(--spectrum-textfield-focus-indicator-gap)) + var(--mod-textfield-focus-indicator-width,var(--spectrum-textfield-focus-indicator-width)))*-1);inset-inline-start:0}:host([quiet][focused]) #textfield:after{background-color:var(--highcontrast-textfield-focus-indicator-color,var(--mod-textfield-focus-indicator-color,var(--spectrum-textfield-focus-indicator-color)))}:host([quiet][invalid]) #textfield .input{padding-inline-end:calc(var(--mod-textfield-icon-spacing-inline-start-invalid,var(--spectrum-textfield-icon-spacing-inline-start-invalid)) + var(--mod-textfield-icon-size-invalid,var(--spectrum-textfield-icon-size-invalid)))}:host([quiet][valid]) #textfield .input{padding-inline-end:calc(var(--mod-textfield-icon-spacing-inline-start-valid,var(--spectrum-textfield-icon-spacing-inline-start-valid)) + var(--mod-textfield-icon-size-valid,var(--spectrum-textfield-icon-size-valid)))}:host([invalid]) #textfield .icon,:host([valid]) #textfield .icon{pointer-events:all;grid-area:2/2;margin-inline-start:auto;position:absolute;inset-block-start:0}#textfield.spectrum-Textfield--sideLabel .icon{grid-area:1/2/span 1/span 1}:host([valid]) #textfield .icon{color:var(--highcontrast-textfield-icon-color-valid,var(--mod-textfield-icon-color-valid,var(--spectrum-textfield-icon-color-valid)));inset-block-start:var(--mod-textfield-icon-spacing-block-valid,var(--spectrum-textfield-icon-spacing-block-valid));inset-block-end:var(--mod-textfield-icon-spacing-block-valid,var(--spectrum-textfield-icon-spacing-block-valid));inset-inline-end:var(--mod-textfield-icon-spacing-inline-end-valid,var(--spectrum-textfield-icon-spacing-inline-end-valid))}:host([invalid]) #textfield .icon{block-size:var(--mod-textfield-icon-size-invalid,var(--spectrum-textfield-icon-size-invalid));inline-size:var(--mod-textfield-icon-size-invalid,var(--spectrum-textfield-icon-size-invalid));color:var(--highcontrast-textfield-icon-color-invalid,var(--mod-textfield-icon-color-invalid,var(--spectrum-textfield-icon-color-invalid)));inset-block-start:var(--mod-textfield-icon-spacing-block-invalid,var(--spectrum-textfield-icon-spacing-block-invalid));inset-block-end:var(--mod-textfield-icon-spacing-block-invalid,var(--spectrum-textfield-icon-spacing-block-invalid));inset-inline-end:var(--mod-textfield-icon-spacing-inline-end-invalid,var(--spectrum-textfield-icon-spacing-inline-end-invalid))}:host([disabled]) #textfield .icon,:host([readonly]) #textfield .icon{color:#0000}:host([quiet]) .icon{padding-inline-end:0}:host([quiet][valid]) .icon{inset-inline-end:var(--mod-textfield-icon-spacing-inline-end-quiet-valid,var(--spectrum-textfield-icon-spacing-inline-end-quiet-valid))}:host([quiet][invalid]) .icon{inset-inline-end:var(--mod-textfield-icon-spacing-inline-end-quiet-invalid,var(--spectrum-textfield-icon-spacing-inline-end-quiet-invalid))}#textfield .spectrum-FieldLabel{grid-area:1/1/auto/span 1;margin-block-end:var(--mod-textfield-label-spacing-block,var(--spectrum-textfield-label-spacing-block))}:host([quiet]) .spectrum-FieldLabel{margin-block-end:var(--mod-textfield-label-spacing-block-quiet,var(--spectrum-textfield-label-spacing-block-quiet))}:host([disabled]) .spectrum-FieldLabel{color:var(--spectrum-textfield-text-color-disabled)}#textfield .spectrum-HelpText{grid-area:3/1/auto/span 2;margin-block-start:var(--mod-textfield-helptext-spacing-block,var(--spectrum-textfield-helptext-spacing-block))}.spectrum-Textfield-characterCount{font-size:var(--mod-textfield-character-count-font-size,var(--spectrum-textfield-character-count-font-size));font-family:var(--mod-textfield-character-count-font-family,var(--spectrum-textfield-character-count-font-family));font-weight:var(--mod-textfield-character-count-font-weight,var(--spectrum-textfield-character-count-font-weight));grid-area:1/2/auto/span 1;justify-content:flex-end;align-items:flex-end;inline-size:auto;margin-block-end:var(--mod-textfield-character-count-spacing-block,var(--spectrum-textfield-character-count-spacing-block));margin-inline-start:var(--mod-textfield-character-count-spacing-inline,var(--spectrum-textfield-character-count-spacing-inline));margin-inline-end:0;padding-inline-end:calc(var(--mod-textfield-corner-radius,var(--spectrum-textfield-corner-radius))/2);display:inline-flex}:host([quiet]) .spectrum-Textfield-characterCount{margin-block-end:var(--mod-textfield-character-count-spacing-block-quiet,var(--spectrum-textfield-character-count-spacing-block-quiet))}.input{line-height:var(--spectrum-textfield-input-line-height);box-sizing:border-box;min-inline-size:var(--mod-textfield-min-width,var(--spectrum-textfield-min-width));block-size:var(--mod-textfield-height,var(--spectrum-textfield-height));padding-block-start:calc(var(--mod-textfield-spacing-block-start,var(--spectrum-textfield-spacing-block-start)) - var(--mod-textfield-border-width,var(--spectrum-textfield-border-width)));padding-block-end:calc(var(--mod-textfield-spacing-block-end,var(--spectrum-textfield-spacing-block-end)) - var(--mod-textfield-border-width,var(--spectrum-textfield-border-width)));padding-inline:calc(var(--mod-textfield-spacing-inline,var(--spectrum-textfield-spacing-inline)) - var(--mod-textfield-border-width,var(--spectrum-textfield-border-width)));text-indent:0;vertical-align:top;background-color:var(--mod-textfield-background-color,var(--spectrum-textfield-background-color));border:var(--mod-textfield-border-width,var(--spectrum-textfield-border-width))solid var(--highcontrast-textfield-border-color,var(--mod-textfield-border-color,var(--spectrum-textfield-border-color)));border-radius:var(--mod-textfield-corner-radius,var(--spectrum-textfield-corner-radius));transition:border-color var(--mod-texfield-animation-duration,var(--spectrum-texfield-animation-duration))ease-in-out;font-size:var(--mod-textfield-placeholder-font-size,var(--spectrum-textfield-placeholder-font-size));font-family:var(--mod-textfield-font-family,var(--spectrum-textfield-font-family));font-weight:var(--mod-textfield-font-weight,var(--spectrum-textfield-font-weight));color:var(--highcontrast-textfield-text-color-default,var(--mod-textfield-text-color-default,var(--spectrum-textfield-text-color-default)));text-overflow:ellipsis;appearance:textfield;outline:none;grid-area:2/1/auto/span 2;inline-size:100%;margin:0}.input::-ms-clear{block-size:0;inline-size:0}.input::-webkit-inner-spin-button,.input::-webkit-outer-spin-button{appearance:none;margin:0}.input:-moz-ui-invalid{box-shadow:none}.input::placeholder{opacity:1;font-size:var(--mod-textfield-placeholder-font-size,var(--spectrum-textfield-placeholder-font-size));font-family:var(--mod-textfield-font-family,var(--spectrum-textfield-font-family));font-weight:var(--mod-textfield-font-weight,var(--spectrum-textfield-font-weight));color:var(--highcontrast-textfield-text-color-default,var(--mod-textfield-text-color-default,var(--spectrum-textfield-text-color-default)));transition:color var(--mod-texfield-animation-duration,var(--spectrum-texfield-animation-duration))ease-in-out}.input:lang(ja)::placeholder,.input:lang(ko)::placeholder,.input:lang(zh)::placeholder{font-style:normal}.input:lang(ja)::-moz-placeholder,.input:lang(ko)::-moz-placeholder,.input:lang(zh)::-moz-placeholder{font-style:normal}:host([focused]) .input,.input:focus{border-color:var(--highcontrast-textfield-border-color-focus,var(--mod-textfield-border-color-focus,var(--spectrum-textfield-border-color-focus)));color:var(--highcontrast-textfield-text-color-focus,var(--mod-textfield-text-color-focus,var(--spectrum-textfield-text-color-focus)))}:host([focused]) .input::placeholder,.input:focus::placeholder{color:var(--highcontrast-textfield-text-color-focus,var(--mod-textfield-text-color-focus,var(--spectrum-textfield-text-color-focus)))}:host([focused]) .input{border-color:var(--highcontrast-textfield-border-color-keyboard-focus,var(--mod-textfield-border-color-keyboard-focus,var(--spectrum-textfield-border-color-keyboard-focus)));color:var(--highcontrast-textfield-text-color-keyboard-focus,var(--mod-textfield-text-color-keyboard-focus,var(--spectrum-textfield-text-color-keyboard-focus)));outline:var(--mod-textfield-focus-indicator-width,var(--spectrum-textfield-focus-indicator-width))solid;outline-color:var(--highcontrast-textfield-focus-indicator-color,var(--mod-textfield-focus-indicator-color,var(--spectrum-textfield-focus-indicator-color)));outline-offset:var(--mod-textfield-focus-indicator-gap,var(--spectrum-textfield-focus-indicator-gap))}:host([focused]) .input::placeholder{color:var(--highcontrast-textfield-text-color-keyboard-focus,var(--mod-textfield-text-color-keyboard-focus,var(--spectrum-textfield-text-color-keyboard-focus)))}:host([valid]) .input{color:var(--highcontrast-textfield-text-color-valid,var(--mod-textfield-text-color-valid,var(--spectrum-textfield-text-color-valid)));padding-inline-end:calc(var(--mod-textfield-icon-spacing-inline-start-valid,var(--spectrum-textfield-icon-spacing-inline-start-valid)) + var(--mod-textfield-icon-size-valid,var(--spectrum-textfield-icon-size-valid)) + var(--mod-textfield-icon-spacing-inline-end-valid,var(--spectrum-textfield-icon-spacing-inline-end-valid)) - var(--mod-textfield-border-width,var(--spectrum-textfield-border-width)))}:host([invalid]) .input{color:var(--highcontrast-textfield-text-color-invalid,var(--mod-textfield-text-color-invalid,var(--spectrum-textfield-text-color-invalid)));border-color:var(--highcontrast-textfield-border-color-invalid-default,var(--mod-textfield-border-color-invalid-default,var(--spectrum-textfield-border-color-invalid-default)));padding-inline-end:calc(var(--mod-textfield-icon-spacing-inline-start-invalid,var(--spectrum-textfield-icon-spacing-inline-start-invalid)) + var(--mod-textfield-icon-size-invalid,var(--spectrum-textfield-icon-size-invalid)) + var(--mod-textfield-icon-spacing-inline-end-invalid,var(--spectrum-textfield-icon-spacing-inline-end-invalid)) - var(--mod-textfield-border-width,var(--spectrum-textfield-border-width)))}:host([invalid]) .input:focus,:host([invalid][focused]) .input,:host([invalid]:focus) .input{border-color:var(--highcontrast-textfield-border-color-invalid-focus,var(--mod-textfield-border-color-invalid-focus,var(--spectrum-textfield-border-color-invalid-focus)))}:host([invalid]) .input:focus-visible,:host([invalid][focused]) .input{border-color:var(--highcontrast-textfield-border-color-invalid-keyboard-focus,var(--mod-textfield-border-color-invalid-keyboard-focus,var(--spectrum-textfield-border-color-invalid-keyboard-focus)))}.input:disabled,:host([disabled]) #textfield .input{background-color:var(--mod-textfield-background-color-disabled,var(--spectrum-textfield-background-color-disabled));color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)));-webkit-text-fill-color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)));resize:none;opacity:1;border-color:#0000}.input:disabled::placeholder,:host([disabled]) #textfield .input::placeholder{color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([quiet]) .input{padding-block-start:var(--mod-textfield-spacing-block-start,var(--spectrum-textfield-spacing-block-start));padding-inline:var(--mod-textfield-spacing-inline-quiet,var(--spectrum-textfield-spacing-inline-quiet));background-color:initial;resize:none;border-block-start-width:0;border-inline-width:0;border-radius:0;outline:none;margin-block-end:var(--mod-textfield-spacing-block-quiet,var(--spectrum-textfield-spacing-block-quiet));overflow-y:hidden}:host([quiet][disabled]) .input,.input:disabled{background-color:initial;border-color:var(--mod-textfield-border-color-disabled,var(--spectrum-textfield-border-color-disabled));color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([quiet][disabled]) .input::placeholder,.input:disabled::placeholder{color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}.input:read-only,:host([readonly]) #textfield .input{background-color:initial;color:var(--highcontrast-textfield-text-color-readonly,var(--mod-textfield-text-color-readonly,var(--spectrum-textfield-text-color-readonly)));border-color:#0000;outline:none}.input:read-only::placeholder,:host([readonly]) #textfield .input::placeholder{color:var(--highcontrast-textfield-text-color-readonly,var(--mod-textfield-text-color-readonly,var(--spectrum-textfield-text-color-readonly)));background-color:initial}@media (hover:hover){.input:hover,#textfield:hover .input{border-color:var(--highcontrast-textfield-border-color-hover,var(--mod-textfield-border-color-hover,var(--spectrum-textfield-border-color-hover)));color:var(--highcontrast-textfield-text-color-hover,var(--mod-textfield-text-color-hover,var(--spectrum-textfield-text-color-hover)))}.input:hover::placeholder,#textfield:hover .input::placeholder{color:var(--highcontrast-textfield-text-color-hover,var(--mod-textfield-text-color-hover,var(--spectrum-textfield-text-color-hover)))}:host([focused]) .input:hover,.input:focus:hover{border-color:var(--highcontrast-textfield-border-color-focus-hover,var(--mod-textfield-border-color-focus-hover,var(--spectrum-textfield-border-color-focus-hover)))}:host([focused]) .input:hover,:host([focused]) .input:hover::placeholder,.input:focus:hover,.input:focus:hover::placeholder{color:var(--highcontrast-textfield-text-color-focus-hover,var(--mod-textfield-text-color-focus-hover,var(--spectrum-textfield-text-color-focus-hover)))}:host([invalid]) .input:hover,:host([invalid]:hover) .input{border-color:var(--highcontrast-textfield-border-color-invalid-hover,var(--mod-textfield-border-color-invalid-hover,var(--spectrum-textfield-border-color-invalid-hover)))}:host([invalid]) .input:focus:hover,:host([invalid][focused]) .input:hover,:host([invalid]:focus) .input:hover{border-color:var(--highcontrast-textfield-border-color-invalid-focus-hover,var(--mod-textfield-border-color-invalid-focus-hover,var(--spectrum-textfield-border-color-invalid-focus-hover)))}:host([disabled]) #textfield:hover .input{background-color:var(--mod-textfield-background-color-disabled,var(--spectrum-textfield-background-color-disabled));color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)));-webkit-text-fill-color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)));resize:none;opacity:1;border-color:#0000}:host([disabled]) #textfield:hover .input::placeholder{color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([quiet][disabled]:hover) .input{background-color:initial;border-color:var(--mod-textfield-border-color-disabled,var(--spectrum-textfield-border-color-disabled));color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([quiet][disabled]:hover) .input::placeholder{color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([readonly]) #textfield:hover .input{background-color:initial;color:var(--highcontrast-textfield-text-color-readonly,var(--mod-textfield-text-color-readonly,var(--spectrum-textfield-text-color-readonly)));border-color:#0000;outline:none}:host([readonly]) #textfield:hover .input::placeholder{color:var(--highcontrast-textfield-text-color-readonly,var(--mod-textfield-text-color-readonly,var(--spectrum-textfield-text-color-readonly)));background-color:initial}}.spectrum-Textfield--sideLabel{grid-template-rows:auto auto;grid-template-columns:auto auto auto}.spectrum-Textfield--sideLabel:after{grid-area:1/2/span 1/span 1}.spectrum-Textfield--sideLabel .spectrum-FieldLabel{grid-area:1/1/span 2/span 1;margin-inline-end:var(--mod-textfield-label-spacing-inline-side-label,var(--spectrum-textfield-label-spacing-inline-side-label))}.spectrum-Textfield--sideLabel .spectrum-Textfield-characterCount{grid-area:1/3/auto/span 1;align-items:flex-start;margin-block-start:var(--mod-textfield-character-count-spacing-block-side,var(--spectrum-textfield-character-count-spacing-block-side));margin-inline-start:var(--mod-textfield-character-count-spacing-inline-side,var(--spectrum-textfield-character-count-spacing-inline-side))}.spectrum-Textfield--sideLabel .spectrum-HelpText{grid-area:2/2/auto/span 1}.spectrum-Textfield--sideLabel .input,.spectrum-Textfield--sideLabel .icon{grid-area:1/2/span 1/span 1}:host([multiline]){--spectrum-textfield-input-line-height:normal}:host([multiline]) .input{min-inline-size:var(--mod-text-area-min-inline-size,var(--spectrum-text-area-min-inline-size));min-block-size:var(--mod-text-area-min-block-size,var(--spectrum-text-area-min-block-size));resize:inherit}:host([multiline][grows]) .input{grid-row:2}:host([multiline][grows]) .spectrum-Textfield--sideLabel .input{grid-row:1}:host([multiline][quiet]) .input{min-block-size:var(--mod-text-area-min-block-size-quiet,var(--spectrum-text-area-min-block-size-quiet));resize:none;overflow-y:hidden}@media (forced-colors:active){:host{--highcontrast-textfield-border-color-hover:Highlight;--highcontrast-textfield-border-color-focus:Highlight;--highcontrast-textfield-border-color-keyboard-focus:CanvasText;--highcontrast-textfield-focus-indicator-color:Highlight;--highcontrast-textfield-border-color-invalid-default:Highlight;--highcontrast-textfield-border-color-invalid-hover:Highlight;--highcontrast-textfield-border-color-invalid-focus:Highlight;--highcontrast-textfield-border-color-invalid-keyboard-focus:Highlight;--highcontrast-textfield-text-color-valid:CanvasText;--highcontrast-textfield-text-color-invalid:CanvasText}#textfield .input{--highcontrast-textfield-text-color-default:CanvasText;--highcontrast-textfield-text-color-hover:CanvasText;--highcontrast-textfield-text-color-keyboard-focus:CanvasText;--highcontrast-textfield-text-color-disabled:GrayText;--highcontrast-textfield-text-color-readonly:CanvasText}#textfield .input::placeholder{--highcontrast-textfield-text-color-default:GrayText;--highcontrast-textfield-text-color-hover:GrayText;--highcontrast-textfield-text-color-keyboard-focus:GrayText;--highcontrast-textfield-text-color-disabled:GrayText;--highcontrast-textfield-text-color-readonly:CanvasText}}:host{--spectrum-textfield-border-color:var(--system-spectrum-textfield-border-color);--spectrum-textfield-border-color-hover:var(--system-spectrum-textfield-border-color-hover);--spectrum-textfield-border-color-focus:var(--system-spectrum-textfield-border-color-focus);--spectrum-textfield-border-color-focus-hover:var(--system-spectrum-textfield-border-color-focus-hover);--spectrum-textfield-border-color-keyboard-focus:var(--system-spectrum-textfield-border-color-keyboard-focus);--spectrum-textfield-border-width:var(--system-spectrum-textfield-border-width)}:host{inline-size:var(--mod-textfield-width,var(--spectrum-textfield-width));flex-direction:column;display:inline-flex}:host([multiline]){resize:both}:host([multiline][readonly]){resize:none}:host([disabled]:focus-visible){outline:none}#textfield{inline-size:100%}#textfield,textarea{resize:inherit}.input{min-inline-size:var(--spectrum-textfield-min-width)}:host([focused]) .input{caret-color:var(--swc-test-caret-color);forced-color-adjust:var(--swc-test-forced-color-adjust)}#sizer{word-break:break-word;opacity:0;white-space:pre-line;block-size:auto}.icon,.icon-workflow{pointer-events:none}:host([multiline]) #textfield{display:inline-grid}:host([multiline]) textarea{transition:box-shadow var(--spectrum-global-animation-duration-100,.13s)ease-in-out,border-color var(--spectrum-global-animation-duration-100,.13s)ease-in-out}:host([multiline]:not([quiet])) #textfield:after{box-shadow:none}:host([multiline][rows]) .input{resize:none;block-size:auto}:host([multiline][rows="1"]) .input{min-block-size:auto}:host([disabled][quiet]) #textfield .input,:host([disabled][quiet]) #textfield:hover .input,:host([quiet]) .input :disabled{border-color:var(--mod-textfield-border-color-disabled,var(--spectrum-textfield-border-color-disabled));color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)));background-color:#0000}:host([disabled]) #textfield .icon.icon-search,:host([readonly]) #textfield .icon.icon-search{color:var(--highcontrast-textfield-text-color-disabled,var(--mod-textfield-text-color-disabled,var(--spectrum-textfield-text-color-disabled)))}:host([multiline][grows]:not([quiet])) #textfield:after{grid-area:unset;min-block-size:calc(var(--mod-text-area-min-block-size,var(--spectrum-text-area-min-block-size)) + var(--mod-textfield-focus-indicator-gap,var(--spectrum-textfield-focus-indicator-gap))*2)}:host([multiline][grows]:not([rows])) .input:not(#sizer){resize:none;height:100%;position:absolute;top:0;left:0;overflow:hidden}
`;
var textfield_css_default = t14;

// ../node_modules/@spectrum-web-components/textfield/src/Textfield.js
var c16 = Object.defineProperty;
var m9 = Object.getOwnPropertyDescriptor;
var t15 = (p18, a10, e22, n18) => {
  for (var r16 = n18 > 1 ? void 0 : n18 ? m9(a10, e22) : a10, u14 = p18.length - 1, h11; u14 >= 0; u14--) (h11 = p18[u14]) && (r16 = (n18 ? h11(a10, e22, r16) : h11(r16)) || r16);
  return n18 && r16 && c16(a10, e22, r16), r16;
};
var S5 = ["text", "url", "tel", "email", "password"];
var TextfieldBase = class extends ManageHelpText(SizedMixin(Focusable, { noDefaultSize: true })) {
  constructor() {
    super(...arguments);
    this.allowedKeys = "";
    this.focused = false;
    this.invalid = false;
    this.label = "";
    this.placeholder = "";
    this._type = "text";
    this.grows = false;
    this.maxlength = -1;
    this.minlength = -1;
    this.multiline = false;
    this.readonly = false;
    this.rows = -1;
    this.valid = false;
    this._value = "";
    this.quiet = false;
    this.required = false;
  }
  static get styles() {
    return [textfield_css_default, spectrum_icon_checkmark_css_default];
  }
  set type(e22) {
    const n18 = this._type;
    this._type = e22, this.requestUpdate("type", n18);
  }
  get type() {
    var e22;
    return (e22 = S5.find((n18) => n18 === this._type)) != null ? e22 : "text";
  }
  set value(e22) {
    if (e22 === this.value) return;
    const n18 = this._value;
    this._value = e22, this.requestUpdate("value", n18);
  }
  get value() {
    return this._value;
  }
  get focusElement() {
    return this.inputElement;
  }
  setSelectionRange(e22, n18, r16 = "none") {
    this.inputElement.setSelectionRange(e22, n18, r16);
  }
  select() {
    this.inputElement.select();
  }
  handleInput(e22) {
    if (this.allowedKeys && this.inputElement.value && !new RegExp(`^[${this.allowedKeys}]*$`, "u").test(this.inputElement.value)) {
      const u14 = this.inputElement.selectionStart - 1;
      this.inputElement.value = this.value.toString(), this.inputElement.setSelectionRange(u14, u14);
      return;
    }
    this.value = this.inputElement.value;
  }
  handleChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
  onFocus() {
    this.focused = !this.readonly && true;
  }
  onBlur(e22) {
    this.focused = !this.readonly && false;
  }
  handleInputElementPointerdown() {
  }
  renderStateIcons() {
    return this.invalid ? x`
                <sp-icon-alert id="invalid" class="icon"></sp-icon-alert>
            ` : this.valid ? x`
                <sp-icon-checkmark100
                    id="valid"
                    class="icon spectrum-UIIcon-Checkmark100"
                ></sp-icon-checkmark100>
            ` : A;
  }
  get displayValue() {
    return this.value.toString();
  }
  get renderMultiline() {
    return x`
            ${this.multiline && this.grows && this.rows === -1 ? x`
                      <div id="sizer" class="input" aria-hidden="true">${this.value}&#8203;
                      </div>
                  ` : A}
            <!-- @ts-ignore -->
            <textarea
                name=${l6(this.name || void 0)}
                aria-describedby=${this.helpTextId}
                aria-label=${this.label || this.appliedLabel || this.placeholder}
                aria-invalid=${l6(this.invalid || void 0)}
                class="input"
                maxlength=${l6(this.maxlength > -1 ? this.maxlength : void 0)}
                minlength=${l6(this.minlength > -1 ? this.minlength : void 0)}
                title=${this.invalid ? "" : A}
                pattern=${l6(this.pattern)}
                placeholder=${this.placeholder}
                .value=${this.displayValue}
                @change=${this.handleChange}
                @input=${this.handleInput}
                @focus=${this.onFocus}
                @blur=${this.onBlur}
                ?disabled=${this.disabled}
                ?required=${this.required}
                ?readonly=${this.readonly}
                rows=${l6(this.rows > -1 ? this.rows : void 0)}
                autocomplete=${l6(this.autocomplete)}
            ></textarea>
        `;
  }
  get renderInput() {
    return x`
            <!-- @ts-ignore -->
            <input
                name=${l6(this.name || void 0)}
                type=${this.type}
                aria-describedby=${this.helpTextId}
                aria-label=${this.label || this.appliedLabel || this.placeholder}
                aria-invalid=${l6(this.invalid || void 0)}
                class="input"
                title=${this.invalid ? "" : A}
                maxlength=${l6(this.maxlength > -1 ? this.maxlength : void 0)}
                minlength=${l6(this.minlength > -1 ? this.minlength : void 0)}
                pattern=${l6(this.pattern)}
                placeholder=${this.placeholder}
                .value=${l9(this.displayValue)}
                @change=${this.handleChange}
                @input=${this.handleInput}
                @pointerdown=${this.handleInputElementPointerdown}
                @focus=${this.onFocus}
                @blur=${this.onBlur}
                ?disabled=${this.disabled}
                ?required=${this.required}
                ?readonly=${this.readonly}
                autocomplete=${l6(this.autocomplete)}
            />
        `;
  }
  renderField() {
    return x`
            ${this.renderStateIcons()}
            ${this.multiline ? this.renderMultiline : this.renderInput}
        `;
  }
  render() {
    return x`
            <div id="textfield">${this.renderField()}</div>
            ${this.renderHelpText(this.invalid)}
        `;
  }
  update(e22) {
    (e22.has("value") || e22.has("required") && this.required) && this.updateComplete.then(() => {
      this.checkValidity();
    }), super.update(e22);
  }
  checkValidity() {
    let e22 = this.inputElement.checkValidity();
    return (this.required || this.value && this.pattern) && ((this.disabled || this.multiline) && this.pattern && (e22 = new RegExp(`^${this.pattern}$`, "u").test(this.value.toString())), typeof this.minlength != "undefined" && (e22 = e22 && this.value.toString().length >= this.minlength), this.valid = e22, this.invalid = !e22), e22;
  }
};
t15([t4()], TextfieldBase.prototype, "appliedLabel", 2), t15([n7({ attribute: "allowed-keys" })], TextfieldBase.prototype, "allowedKeys", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "focused", 2), t15([i5(".input:not(#sizer)")], TextfieldBase.prototype, "inputElement", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "invalid", 2), t15([n7()], TextfieldBase.prototype, "label", 2), t15([n7({ type: String, reflect: true })], TextfieldBase.prototype, "name", 2), t15([n7()], TextfieldBase.prototype, "placeholder", 2), t15([t4()], TextfieldBase.prototype, "type", 1), t15([n7({ attribute: "type", reflect: true })], TextfieldBase.prototype, "_type", 2), t15([n7()], TextfieldBase.prototype, "pattern", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "grows", 2), t15([n7({ type: Number })], TextfieldBase.prototype, "maxlength", 2), t15([n7({ type: Number })], TextfieldBase.prototype, "minlength", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "multiline", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "readonly", 2), t15([n7({ type: Number })], TextfieldBase.prototype, "rows", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "valid", 2), t15([n7({ type: String })], TextfieldBase.prototype, "value", 1), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "quiet", 2), t15([n7({ type: Boolean, reflect: true })], TextfieldBase.prototype, "required", 2), t15([n7({ type: String, reflect: true })], TextfieldBase.prototype, "autocomplete", 2);
var Textfield = class extends TextfieldBase {
  constructor() {
    super(...arguments);
    this._value = "";
  }
  set value(e22) {
    if (e22 === this.value) return;
    const n18 = this._value;
    this._value = e22, this.requestUpdate("value", n18);
  }
  get value() {
    return this._value;
  }
};
t15([n7({ type: String })], Textfield.prototype, "value", 1);

// ../node_modules/@spectrum-web-components/button/sp-clear-button.js
init_define_element();
defineElement("sp-clear-button", ClearButton);

// ../node_modules/@spectrum-web-components/icons-workflow/src/elements/IconMagnify.js
init_src();

// ../node_modules/@spectrum-web-components/icons-workflow/src/icons/Magnify.js
var MagnifyIcon = ({ width: t16 = 24, height: e22 = 24, hidden: a10 = false, title: l14 = "Magnify" } = {}) => tag2`<svg
    xmlns="http://www.w3.org/2000/svg"
    height=${e22}
    viewBox="0 0 36 36"
    width=${t16}
    aria-hidden=${a10 ? "true" : "false"}
    role="img"
    fill="currentColor"
    aria-label=${l14}
  >
    <path
      d="M33.173 30.215 25.4 22.443a12.826 12.826 0 1 0-2.957 2.957l7.772 7.772a2.1 2.1 0 0 0 2.958-2.958ZM6 15a9 9 0 1 1 9 9 9 9 0 0 1-9-9Z"
    />
  </svg>`;

// ../node_modules/@spectrum-web-components/icons-workflow/src/elements/IconMagnify.js
var IconMagnify = class extends IconBase {
  render() {
    return setCustomTemplateLiteralTag2(x), MagnifyIcon({ hidden: !this.label, title: this.label });
  }
};

// ../node_modules/@spectrum-web-components/icons-workflow/icons/sp-icon-magnify.js
init_define_element();
defineElement("sp-icon-magnify", IconMagnify);

// ../node_modules/@spectrum-web-components/search/src/search.css.js
init_src();
var e18 = i3`
    :host{--spectrum-search-inline-size:var(--spectrum-field-width);--spectrum-search-block-size:var(--spectrum-component-height-100);--spectrum-search-button-inline-size:var(--spectrum-search-block-size);--spectrum-search-min-inline-size:calc(var(--spectrum-search-field-minimum-width-multiplier)*var(--spectrum-search-block-size));--spectrum-search-icon-size:var(--spectrum-workflow-icon-size-100);--spectrum-search-text-to-icon:var(--spectrum-text-to-visual-100);--spectrum-search-to-help-text:var(--spectrum-help-text-to-component);--spectrum-search-top-to-text:var(--spectrum-component-top-to-text-100);--spectrum-search-bottom-to-text:var(--spectrum-component-bottom-to-text-100);--spectrum-search-focus-indicator-thickness:var(--spectrum-focus-indicator-thickness);--spectrum-search-focus-indicator-gap:var(--spectrum-focus-indicator-gap);--spectrum-search-focus-indicator-color:var(--spectrum-focus-indicator-color);--spectrum-search-font-family:var(--spectrum-sans-font-family-stack);--spectrum-search-font-weight:var(--spectrum-regular-font-weight);--spectrum-search-font-style:var(--spectrum-default-font-style);--spectrum-search-line-height:var(--spectrum-line-height-100);--spectrum-search-color-default:var(--spectrum-neutral-content-color-default);--spectrum-search-color-hover:var(--spectrum-neutral-content-color-hover);--spectrum-search-color-focus:var(--spectrum-neutral-content-color-focus);--spectrum-search-color-focus-hover:var(--spectrum-neutral-content-color-focus-hover);--spectrum-search-color-key-focus:var(--spectrum-neutral-content-color-key-focus);--spectrum-search-border-width:var(--spectrum-border-width-100);--spectrum-search-background-color:var(--spectrum-gray-50);--spectrum-search-color-disabled:var(--spectrum-disabled-content-color);--spectrum-search-background-color-disabled:var(--spectrum-disabled-background-color);--spectrum-search-border-color-disabled:var(--spectrum-disabled-background-color);--mod-textfield-font-family:var(--mod-search-font-family,var(--spectrum-search-font-family));--mod-textfield-font-weight:var(--mod-search-font-weight,var(--spectrum-search-font-weight));--mod-textfield-corner-radius:var(--mod-search-border-radius,var(--spectrum-search-border-radius));--mod-textfield-border-width:var(--mod-search-border-width,var(--spectrum-search-border-width));--mod-textfield-focus-indicator-gap:var(--mod-search-focus-indicator-gap,var(--spectrum-search-focus-indicator-gap));--mod-textfield-focus-indicator-width:var(--mod-search-focus-indicator-thickness,var(--spectrum-search-focus-indicator-thickness));--mod-textfield-focus-indicator-color:var(--mod-search-focus-indicator-color,var(--spectrum-search-focus-indicator-color));--mod-textfield-text-color-default:var(--mod-search-color-default,var(--spectrum-search-color-default));--mod-textfield-text-color-hover:var(--mod-search-color-hover,var(--spectrum-search-color-hover));--mod-textfield-text-color-focus:var(--mod-search-color-focus,var(--spectrum-search-color-focus));--mod-textfield-text-color-focus-hover:var(--mod-search-color-focus-hover,var(--spectrum-search-color-focus-hover));--mod-textfield-text-color-keyboard-focus:var(--mod-search-color-key-focus,var(--spectrum-search-color-key-focus));--mod-textfield-text-color-disabled:var(--mod-search-color-disabled,var(--spectrum-search-color-disabled));--mod-textfield-border-color:var(--mod-search-border-color-default,var(--spectrum-search-border-color-default));--mod-textfield-border-color-hover:var(--mod-search-border-color-hover,var(--spectrum-search-border-color-hover));--mod-textfield-border-color-focus:var(--mod-search-border-color-focus,var(--spectrum-search-border-color-focus));--mod-textfield-border-color-focus-hover:var(--mod-search-border-color-focus-hover,var(--spectrum-search-border-color-focus-hover));--mod-textfield-border-color-keyboard-focus:var(--mod-search-border-color-key-focus,var(--spectrum-search-border-color-key-focus));--mod-textfield-border-color-disabled:var(--mod-search-border-color-disabled,var(--spectrum-search-border-color-disabled));--mod-textfield-background-color:var(--mod-search-background-color,var(--spectrum-search-background-color));--mod-textfield-background-color-disabled:var(--mod-search-background-color-disabled,var(--spectrum-search-background-color-disabled))}:host([size=s]){--spectrum-search-block-size:var(--spectrum-component-height-75);--spectrum-search-icon-size:var(--spectrum-workflow-icon-size-75);--spectrum-search-text-to-icon:var(--spectrum-text-to-visual-75)}:host([size=l]){--spectrum-search-block-size:var(--spectrum-component-height-200);--spectrum-search-icon-size:var(--spectrum-workflow-icon-size-200);--spectrum-search-text-to-icon:var(--spectrum-text-to-visual-200)}:host([size=xl]){--spectrum-search-block-size:var(--spectrum-component-height-300);--spectrum-search-icon-size:var(--spectrum-workflow-icon-size-300);--spectrum-search-text-to-icon:var(--spectrum-text-to-visual-300)}:host([quiet]){--spectrum-search-quiet-button-offset:calc(var(--mod-search-block-size,var(--spectrum-search-block-size))/2 - var(--mod-workflow-icon-size-100,var(--spectrum-workflow-icon-size-100))/2);--spectrum-search-background-color:transparent;--spectrum-search-background-color-disabled:transparent;--spectrum-search-border-color-disabled:var(--spectrum-disabled-border-color)}:host([quiet]) #textfield{--spectrum-search-border-radius:0;--spectrum-search-edge-to-visual:var(--spectrum-field-edge-to-visual-quiet)}@media (forced-colors:active){#textfield #textfield,#textfield #textfield .input{--highcontrast-search-color-default:CanvasText;--highcontrast-search-color-hover:CanvasText;--highcontrast-search-color-focus:CanvasText;--highcontrast-search-color-disabled:GrayText}#textfield #button .spectrum-ClearButton-fill{forced-color-adjust:none;background-color:initial}}#textfield{inline-size:var(--mod-search-inline-size,var(--spectrum-search-inline-size));min-inline-size:var(--mod-search-min-inline-size,var(--spectrum-search-min-inline-size));display:inline-block;position:relative}#textfield .spectrum-HelpText{margin-block-start:var(--mod-search-to-help-text,var(--spectrum-search-to-help-text))}#button{border-radius:var(--mod-search-border-radius,var(--spectrum-search-border-radius));position:absolute;inset-block-start:0;inset-inline-end:0}#button .spectrum-ClearButton-fill{border-radius:var(--mod-search-border-radius,var(--spectrum-search-border-radius))}#textfield.is-disabled #button{display:none}#textfield{inline-size:100%}.icon-search{--spectrum-search-color:var(--highcontrast-search-color-default,var(--mod-search-color-default,var(--spectrum-search-color-default)));color:var(--spectrum-search-color);margin-block:auto;display:block;position:absolute;inset-block:0}#textfield.is-focused .icon-search{--spectrum-search-color:var(--highcontrast-search-color-focus,var(--mod-search-color-focus,var(--spectrum-search-color-focus)))}#textfield.is-keyboardFocused .icon-search{--spectrum-search-color:var(--highcontrast-search-color-focus,var(--mod-search-color-key-focus,var(--spectrum-search-color-key-focus)))}#textfield.is-disabled .icon-search{--spectrum-search-color:var(--highcontrast-search-color-disabled,var(--mod-search-color-disabled,var(--spectrum-search-color-disabled)))}@media (hover:hover){#textfield:hover .icon-search{--spectrum-search-color:var(--highcontrast-search-color-hover,var(--mod-search-color-hover,var(--spectrum-search-color-hover)))}#textfield.is-focused:hover .icon-search{--spectrum-search-color:var(--highcontrast-search-color-focus,var(--mod-search-color-focus-hover,var(--spectrum-search-color-focus-hover)))}#textfield.is-disabled:hover .icon-search{--spectrum-search-color:var(--highcontrast-search-color-disabled,var(--mod-search-color-disabled,var(--spectrum-search-color-disabled)))}}.input{appearance:none;block-size:var(--mod-search-block-size,var(--spectrum-search-block-size));font-style:var(--mod-search-font-style,var(--spectrum-search-font-style));line-height:var(--mod-search-line-height,var(--spectrum-search-line-height));padding-block-start:calc(var(--mod-search-top-to-text,var(--spectrum-search-top-to-text)) - var(--mod-search-border-width,var(--spectrum-search-border-width)));padding-block-end:calc(var(--mod-search-bottom-to-text,var(--spectrum-search-bottom-to-text)) - var(--mod-search-border-width,var(--spectrum-search-border-width)))}.input::-webkit-search-cancel-button,.input::-webkit-search-decoration{appearance:none}:host(:not([quiet])) #textfield .icon-search{inset-inline-start:var(--mod-search-edge-to-visual,var(--spectrum-search-edge-to-visual))}:host(:not([quiet])) #textfield .input{padding-inline-start:calc(var(--mod-search-edge-to-visual,var(--spectrum-search-edge-to-visual)) - var(--mod-search-border-width,var(--spectrum-search-border-width)) + var(--mod-search-icon-size,var(--spectrum-search-icon-size)) + var(--mod-search-text-to-icon,var(--spectrum-search-text-to-icon)));padding-inline-end:calc(var(--mod-search-button-inline-size,var(--spectrum-search-button-inline-size)) - var(--mod-search-border-width,var(--spectrum-search-border-width)))}:host([quiet]) #button{transform:translateX(var(--mod-search-quiet-button-offset,var(--spectrum-search-quiet-button-offset)))}:host([quiet]) #textfield .input{border-radius:var(--mod-search-border-radius,var(--spectrum-search-border-radius));padding-block-start:var(--mod-search-top-to-text,var(--spectrum-search-top-to-text));padding-inline-start:calc(var(--mod-search-edge-to-visual,var(--spectrum-search-edge-to-visual)) + var(--mod-search-icon-size,var(--spectrum-search-icon-size)) + var(--mod-search-text-to-icon,var(--spectrum-search-text-to-icon)));padding-inline-end:calc(var(--mod-search-button-inline-size,var(--spectrum-search-button-inline-size)) - var(--mod-search-quiet-button-offset,var(--spectrum-search-quiet-button-offset)))}:host{--spectrum-search-border-radius:var(--system-spectrum-search-border-radius);--spectrum-search-edge-to-visual:var(--system-spectrum-search-edge-to-visual);--spectrum-search-border-color-default:var(--system-spectrum-search-border-color-default);--spectrum-search-border-color-hover:var(--system-spectrum-search-border-color-hover);--spectrum-search-border-color-focus:var(--system-spectrum-search-border-color-focus);--spectrum-search-border-color-focus-hover:var(--system-spectrum-search-border-color-focus-hover);--spectrum-search-border-color-key-focus:var(--system-spectrum-search-border-color-key-focus)}:host([size=s]){--spectrum-search-border-radius:var(--system-spectrum-search-sizes-border-radius);--spectrum-search-edge-to-visual:var(--system-spectrum-search-sizes-edge-to-visual)}:host{--spectrum-search-border-radius:var(--system-spectrum-search-sizem-border-radius);--spectrum-search-edge-to-visual:var(--system-spectrum-search-sizem-edge-to-visual)}:host([size=l]){--spectrum-search-border-radius:var(--system-spectrum-search-sizel-border-radius);--spectrum-search-edge-to-visual:var(--system-spectrum-search-sizel-edge-to-visual)}:host([size=xl]){--spectrum-search-border-radius:var(--system-spectrum-search-sizexl-border-radius);--spectrum-search-edge-to-visual:var(--system-spectrum-search-sizexl-edge-to-visual)}:host{--mod-textfield-spacing-inline:var(--spectrum-alias-infieldbutton-full-height-m);--mod-clear-button-padding:0}input::-webkit-search-cancel-button{display:none}:host([size=xs]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-50)}:host([size=s]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-75)}:host([size=m]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-100)}:host([size=l]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-200)}:host([size=xl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-300)}:host([size=xxl]){--spectrum-icon-size:var(--spectrum-workflow-icon-size-400)}@media (forced-colors:active){sp-clear-button{--spectrum-clearbutton-fill-background-color:transparent;--spectrum-clearbutton-fill-background-color-disabled:transparent;--spectrum-clearbutton-fill-background-color-down:transparent;--spectrum-clearbutton-fill-background-color-hover:transparent;--spectrum-clearbutton-fill-background-color-key-focus:transparent}}
`;
var search_css_default = e18;

// ../node_modules/@spectrum-web-components/search/src/Search.js
var d11 = Object.defineProperty;
var c17 = Object.getOwnPropertyDescriptor;
var r13 = (o26, s14, e22, t16) => {
  for (var i20 = t16 > 1 ? void 0 : t16 ? c17(s14, e22) : s14, n18 = o26.length - 1, a10; n18 >= 0; n18--) (a10 = o26[n18]) && (i20 = (t16 ? a10(s14, e22, i20) : a10(i20)) || i20);
  return t16 && i20 && d11(s14, e22, i20), i20;
};
var v2 = (o26) => o26.stopPropagation();
var Search = class extends Textfield {
  constructor() {
    super(...arguments);
    this.action = "";
    this.label = "Search";
    this.placeholder = "Search";
  }
  static get styles() {
    return [...super.styles, search_css_default];
  }
  handleSubmit(e22) {
    this.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })) || e22.preventDefault();
  }
  handleKeydown(e22) {
    const { code: t16 } = e22;
    t16 === "Escape" && this.holdValueOnEscape || !this.value || t16 !== "Escape" || this.reset();
  }
  async reset() {
    this.value = "", await this.updateComplete, this.focusElement.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true })), this.focusElement.dispatchEvent(new InputEvent("change", { bubbles: true }));
  }
  renderField() {
    return x`
            <form
                action=${this.action}
                id="form"
                method=${l6(this.method)}
                @submit=${this.handleSubmit}
                @reset=${this.reset}
                @keydown=${this.handleKeydown}
            >
                <sp-icon-magnify
                    class="icon magnifier icon-workflow icon-search"
                ></sp-icon-magnify>
                ${super.renderField()}
                ${this.value ? x`
                          <sp-clear-button
                              id="button"
                              label="Reset"
                              tabindex="-1"
                              type="reset"
                              size=${l6(this.size)}
                              @keydown=${v2}
                          ></sp-clear-button>
                      ` : A}
            </form>
        `;
  }
  firstUpdated(e22) {
    super.firstUpdated(e22), this.hasAttribute("holdValueOnEscape") || this.inputElement.setAttribute("type", "search");
  }
  willUpdate() {
    this.multiline = false;
  }
};
r13([n7()], Search.prototype, "action", 2), r13([n7()], Search.prototype, "label", 2), r13([n7()], Search.prototype, "method", 2), r13([n7()], Search.prototype, "placeholder", 2), r13([n7({ type: Boolean })], Search.prototype, "holdValueOnEscape", 2), r13([i5("#form")], Search.prototype, "form", 2);

// ../node_modules/@spectrum-web-components/search/sp-search.js
init_define_element();
defineElement("sp-search", Search);

// ../node_modules/@spectrum-web-components/theme/src/scale-medium.css.js
init_src();
var e19 = i3`
    :root,:host{--spectrum-global-dimension-scale-factor:1;--spectrum-global-dimension-size-0:0px;--spectrum-global-dimension-size-10:1px;--spectrum-global-dimension-size-25:2px;--spectrum-global-dimension-size-30:2px;--spectrum-global-dimension-size-40:3px;--spectrum-global-dimension-size-50:4px;--spectrum-global-dimension-size-65:5px;--spectrum-global-dimension-size-75:6px;--spectrum-global-dimension-size-85:7px;--spectrum-global-dimension-size-100:8px;--spectrum-global-dimension-size-115:9px;--spectrum-global-dimension-size-125:10px;--spectrum-global-dimension-size-130:11px;--spectrum-global-dimension-size-150:12px;--spectrum-global-dimension-size-160:13px;--spectrum-global-dimension-size-175:14px;--spectrum-global-dimension-size-185:15px;--spectrum-global-dimension-size-200:16px;--spectrum-global-dimension-size-225:18px;--spectrum-global-dimension-size-250:20px;--spectrum-global-dimension-size-275:22px;--spectrum-global-dimension-size-300:24px;--spectrum-global-dimension-size-325:26px;--spectrum-global-dimension-size-350:28px;--spectrum-global-dimension-size-400:32px;--spectrum-global-dimension-size-450:36px;--spectrum-global-dimension-size-500:40px;--spectrum-global-dimension-size-550:44px;--spectrum-global-dimension-size-600:48px;--spectrum-global-dimension-size-650:52px;--spectrum-global-dimension-size-675:54px;--spectrum-global-dimension-size-700:56px;--spectrum-global-dimension-size-750:60px;--spectrum-global-dimension-size-800:64px;--spectrum-global-dimension-size-900:72px;--spectrum-global-dimension-size-1000:80px;--spectrum-global-dimension-size-1125:90px;--spectrum-global-dimension-size-1200:96px;--spectrum-global-dimension-size-1250:100px;--spectrum-global-dimension-size-1600:128px;--spectrum-global-dimension-size-1700:136px;--spectrum-global-dimension-size-1800:144px;--spectrum-global-dimension-size-2000:160px;--spectrum-global-dimension-size-2400:192px;--spectrum-global-dimension-size-2500:200px;--spectrum-global-dimension-size-3000:240px;--spectrum-global-dimension-size-3400:272px;--spectrum-global-dimension-size-3600:288px;--spectrum-global-dimension-size-4600:368px;--spectrum-global-dimension-size-5000:400px;--spectrum-global-dimension-size-6000:480px;--spectrum-global-dimension-font-size-25:10px;--spectrum-global-dimension-font-size-50:11px;--spectrum-global-dimension-font-size-75:12px;--spectrum-global-dimension-font-size-100:14px;--spectrum-global-dimension-font-size-150:15px;--spectrum-global-dimension-font-size-200:16px;--spectrum-global-dimension-font-size-300:18px;--spectrum-global-dimension-font-size-400:20px;--spectrum-global-dimension-font-size-500:22px;--spectrum-global-dimension-font-size-600:25px;--spectrum-global-dimension-font-size-700:28px;--spectrum-global-dimension-font-size-800:32px;--spectrum-global-dimension-font-size-900:36px;--spectrum-global-dimension-font-size-1000:40px;--spectrum-global-dimension-font-size-1100:45px;--spectrum-global-dimension-font-size-1200:50px;--spectrum-global-dimension-font-size-1300:60px;--spectrum-alias-item-text-padding-top-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-text-padding-bottom-s:var(--spectrum-global-dimension-static-size-65);--spectrum-alias-item-workflow-padding-left-m:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-rounded-workflow-padding-left-m:var(--spectrum-global-dimension-size-175);--spectrum-alias-item-rounded-workflow-padding-left-xl:21px;--spectrum-alias-item-mark-padding-top-m:var(--spectrum-global-dimension-static-size-75);--spectrum-alias-item-mark-padding-bottom-m:var(--spectrum-global-dimension-static-size-75);--spectrum-alias-item-mark-padding-left-m:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-control-1-size-l:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-control-1-size-xl:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-control-2-size-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-control-3-height-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-control-3-width-s:23px;--spectrum-alias-item-control-3-width-m:var(--spectrum-global-dimension-static-size-325);--spectrum-alias-item-control-3-width-l:29px;--spectrum-alias-item-control-3-width-xl:33px;--spectrum-alias-item-mark-size-m:var(--spectrum-global-dimension-size-250);--spectrum-alias-component-focusring-border-radius:var(--spectrum-global-dimension-static-size-65);--spectrum-alias-control-two-size-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-control-three-height-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-control-three-width-s:23px;--spectrum-alias-control-three-width-m:var(--spectrum-global-dimension-static-size-325);--spectrum-alias-control-three-width-l:29px;--spectrum-alias-control-three-width-xl:33px;--spectrum-alias-focus-ring-border-radius-regular:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-focus-ring-radius-default:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-workflow-icon-size-l:var(--spectrum-global-dimension-static-size-250);--spectrum-alias-ui-icon-chevron-size-75:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-chevron-size-100:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-chevron-size-200:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-chevron-size-300:var(--spectrum-global-dimension-static-size-175);--spectrum-alias-ui-icon-chevron-size-400:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-chevron-size-500:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-checkmark-size-50:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-checkmark-size-75:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-checkmark-size-100:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-checkmark-size-200:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-checkmark-size-300:var(--spectrum-global-dimension-static-size-175);--spectrum-alias-ui-icon-checkmark-size-400:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-checkmark-size-500:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-checkmark-size-600:var(--spectrum-global-dimension-static-size-225);--spectrum-alias-ui-icon-dash-size-50:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-ui-icon-dash-size-75:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-ui-icon-dash-size-100:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-dash-size-200:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-dash-size-300:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-dash-size-400:var(--spectrum-global-dimension-static-size-175);--spectrum-alias-ui-icon-dash-size-500:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-dash-size-600:var(--spectrum-global-dimension-static-size-225);--spectrum-alias-ui-icon-cross-size-75:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-ui-icon-cross-size-100:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-ui-icon-cross-size-200:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-cross-size-300:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-cross-size-400:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-cross-size-500:var(--spectrum-global-dimension-static-size-175);--spectrum-alias-ui-icon-cross-size-600:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-arrow-size-75:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-arrow-size-100:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-arrow-size-200:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-ui-icon-arrow-size-300:var(--spectrum-global-dimension-static-size-175);--spectrum-alias-ui-icon-arrow-size-400:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-ui-icon-arrow-size-500:var(--spectrum-global-dimension-static-size-225);--spectrum-alias-ui-icon-arrow-size-600:var(--spectrum-global-dimension-static-size-250);--spectrum-alias-ui-icon-triplegripper-size-100-width:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-doublegripper-size-100-height:var(--spectrum-global-dimension-static-size-50);--spectrum-alias-ui-icon-singlegripper-size-100-height:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-ui-icon-cornertriangle-size-100:var(--spectrum-global-dimension-static-size-65);--spectrum-alias-ui-icon-cornertriangle-size-300:var(--spectrum-global-dimension-static-size-85);--spectrum-alias-ui-icon-asterisk-size-200:var(--spectrum-global-dimension-static-size-125);--spectrum-alias-ui-icon-asterisk-size-300:var(--spectrum-global-dimension-static-size-125);--spectrum-dialog-confirm-title-text-size:var(--spectrum-alias-heading-s-text-size);--spectrum-dialog-confirm-description-text-size:var(--spectrum-global-dimension-font-size-100)}:host,:root{--spectrum-global-alias-appframe-border-size:2px;--swc-scale-factor:1;--spectrum-workflow-icon-size-50:14px;--spectrum-workflow-icon-size-75:16px;--spectrum-workflow-icon-size-100:18px;--spectrum-workflow-icon-size-200:20px;--spectrum-workflow-icon-size-300:22px;--spectrum-arrow-icon-size-75:10px;--spectrum-arrow-icon-size-100:10px;--spectrum-arrow-icon-size-200:12px;--spectrum-arrow-icon-size-300:14px;--spectrum-arrow-icon-size-400:16px;--spectrum-arrow-icon-size-500:18px;--spectrum-arrow-icon-size-600:20px;--spectrum-asterisk-icon-size-100:8px;--spectrum-asterisk-icon-size-200:10px;--spectrum-asterisk-icon-size-300:10px;--spectrum-checkmark-icon-size-50:10px;--spectrum-checkmark-icon-size-75:10px;--spectrum-checkmark-icon-size-100:10px;--spectrum-checkmark-icon-size-200:12px;--spectrum-checkmark-icon-size-300:14px;--spectrum-checkmark-icon-size-400:16px;--spectrum-checkmark-icon-size-500:16px;--spectrum-checkmark-icon-size-600:18px;--spectrum-chevron-icon-size-50:6px;--spectrum-chevron-icon-size-75:10px;--spectrum-chevron-icon-size-100:10px;--spectrum-chevron-icon-size-200:12px;--spectrum-chevron-icon-size-300:14px;--spectrum-chevron-icon-size-400:16px;--spectrum-chevron-icon-size-500:16px;--spectrum-chevron-icon-size-600:18px;--spectrum-corner-triangle-icon-size-75:5px;--spectrum-corner-triangle-icon-size-100:5px;--spectrum-corner-triangle-icon-size-200:6px;--spectrum-corner-triangle-icon-size-300:7px;--spectrum-cross-icon-size-75:8px;--spectrum-cross-icon-size-100:8px;--spectrum-cross-icon-size-200:10px;--spectrum-cross-icon-size-300:12px;--spectrum-cross-icon-size-400:12px;--spectrum-cross-icon-size-500:14px;--spectrum-cross-icon-size-600:16px;--spectrum-dash-icon-size-50:8px;--spectrum-dash-icon-size-75:8px;--spectrum-dash-icon-size-100:10px;--spectrum-dash-icon-size-200:12px;--spectrum-dash-icon-size-300:12px;--spectrum-dash-icon-size-400:14px;--spectrum-dash-icon-size-500:16px;--spectrum-dash-icon-size-600:18px;--spectrum-field-label-text-to-asterisk-small:4px;--spectrum-field-label-text-to-asterisk-medium:4px;--spectrum-field-label-text-to-asterisk-large:5px;--spectrum-field-label-text-to-asterisk-extra-large:5px;--spectrum-field-label-top-to-asterisk-small:8px;--spectrum-field-label-top-to-asterisk-medium:12px;--spectrum-field-label-top-to-asterisk-large:15px;--spectrum-field-label-top-to-asterisk-extra-large:19px;--spectrum-field-label-top-margin-medium:4px;--spectrum-field-label-top-margin-large:5px;--spectrum-field-label-top-margin-extra-large:5px;--spectrum-field-label-to-component-quiet-small:-8px;--spectrum-field-label-to-component-quiet-medium:-8px;--spectrum-field-label-to-component-quiet-large:-12px;--spectrum-field-label-to-component-quiet-extra-large:-15px;--spectrum-help-text-top-to-workflow-icon-small:4px;--spectrum-help-text-top-to-workflow-icon-medium:3px;--spectrum-help-text-top-to-workflow-icon-large:6px;--spectrum-help-text-top-to-workflow-icon-extra-large:9px;--spectrum-status-light-dot-size-medium:8px;--spectrum-status-light-dot-size-large:10px;--spectrum-status-light-dot-size-extra-large:10px;--spectrum-status-light-top-to-dot-small:8px;--spectrum-status-light-top-to-dot-medium:12px;--spectrum-status-light-top-to-dot-large:15px;--spectrum-status-light-top-to-dot-extra-large:19px;--spectrum-action-button-edge-to-hold-icon-medium:4px;--spectrum-action-button-edge-to-hold-icon-large:5px;--spectrum-action-button-edge-to-hold-icon-extra-large:6px;--spectrum-tooltip-tip-width:8px;--spectrum-tooltip-tip-height:4px;--spectrum-tooltip-maximum-width:160px;--spectrum-progress-circle-size-small:16px;--spectrum-progress-circle-size-medium:32px;--spectrum-progress-circle-size-large:64px;--spectrum-progress-circle-thickness-small:2px;--spectrum-progress-circle-thickness-medium:3px;--spectrum-progress-circle-thickness-large:4px;--spectrum-toast-height:48px;--spectrum-toast-maximum-width:336px;--spectrum-toast-top-to-workflow-icon:15px;--spectrum-toast-top-to-text:14px;--spectrum-toast-bottom-to-text:17px;--spectrum-action-bar-height:48px;--spectrum-action-bar-top-to-item-counter:14px;--spectrum-swatch-size-extra-small:16px;--spectrum-swatch-size-small:24px;--spectrum-swatch-size-medium:32px;--spectrum-swatch-size-large:40px;--spectrum-progress-bar-thickness-small:4px;--spectrum-progress-bar-thickness-medium:6px;--spectrum-progress-bar-thickness-large:8px;--spectrum-progress-bar-thickness-extra-large:10px;--spectrum-meter-width:192px;--spectrum-meter-thickness-small:4px;--spectrum-meter-thickness-large:6px;--spectrum-tag-top-to-avatar-small:4px;--spectrum-tag-top-to-avatar-medium:6px;--spectrum-tag-top-to-avatar-large:9px;--spectrum-tag-top-to-cross-icon-small:8px;--spectrum-tag-top-to-cross-icon-medium:12px;--spectrum-tag-top-to-cross-icon-large:15px;--spectrum-popover-top-to-content-area:4px;--spectrum-menu-item-edge-to-content-not-selected-small:28px;--spectrum-menu-item-edge-to-content-not-selected-medium:32px;--spectrum-menu-item-edge-to-content-not-selected-large:38px;--spectrum-menu-item-edge-to-content-not-selected-extra-large:45px;--spectrum-menu-item-top-to-disclosure-icon-small:7px;--spectrum-menu-item-top-to-disclosure-icon-medium:11px;--spectrum-menu-item-top-to-disclosure-icon-large:14px;--spectrum-menu-item-top-to-disclosure-icon-extra-large:17px;--spectrum-menu-item-top-to-selected-icon-small:7px;--spectrum-menu-item-top-to-selected-icon-medium:11px;--spectrum-menu-item-top-to-selected-icon-large:14px;--spectrum-menu-item-top-to-selected-icon-extra-large:17px;--spectrum-slider-control-to-field-label-small:5px;--spectrum-slider-control-to-field-label-medium:8px;--spectrum-slider-control-to-field-label-large:11px;--spectrum-slider-control-to-field-label-extra-large:14px;--spectrum-picker-visual-to-disclosure-icon-small:7px;--spectrum-picker-visual-to-disclosure-icon-medium:8px;--spectrum-picker-visual-to-disclosure-icon-large:9px;--spectrum-picker-visual-to-disclosure-icon-extra-large:10px;--spectrum-text-area-minimum-width:112px;--spectrum-text-area-minimum-height:56px;--spectrum-combo-box-visual-to-field-button-small:7px;--spectrum-combo-box-visual-to-field-button-medium:8px;--spectrum-combo-box-visual-to-field-button-large:9px;--spectrum-combo-box-visual-to-field-button-extra-large:10px;--spectrum-thumbnail-size-50:16px;--spectrum-thumbnail-size-75:18px;--spectrum-thumbnail-size-100:20px;--spectrum-thumbnail-size-200:22px;--spectrum-thumbnail-size-300:26px;--spectrum-thumbnail-size-400:28px;--spectrum-thumbnail-size-500:32px;--spectrum-thumbnail-size-600:36px;--spectrum-thumbnail-size-700:40px;--spectrum-thumbnail-size-800:44px;--spectrum-thumbnail-size-900:50px;--spectrum-thumbnail-size-1000:56px;--spectrum-alert-dialog-title-size:var(--spectrum-heading-size-s);--spectrum-alert-dialog-description-size:var(--spectrum-body-size-s);--spectrum-opacity-checkerboard-square-size:8px;--spectrum-contextual-help-title-size:var(--spectrum-heading-size-xs);--spectrum-contextual-help-body-size:var(--spectrum-body-size-s);--spectrum-breadcrumbs-height-multiline:72px;--spectrum-breadcrumbs-top-to-text:13px;--spectrum-breadcrumbs-top-to-text-compact:11px;--spectrum-breadcrumbs-top-to-text-multiline:12px;--spectrum-breadcrumbs-bottom-to-text:15px;--spectrum-breadcrumbs-bottom-to-text-compact:12px;--spectrum-breadcrumbs-bottom-to-text-multiline:9px;--spectrum-breadcrumbs-start-edge-to-text:8px;--spectrum-breadcrumbs-top-text-to-bottom-text:9px;--spectrum-breadcrumbs-top-to-separator-icon:19px;--spectrum-breadcrumbs-top-to-separator-icon-compact:15px;--spectrum-breadcrumbs-top-to-separator-icon-multiline:15px;--spectrum-breadcrumbs-separator-icon-to-bottom-text-multiline:11px;--spectrum-breadcrumbs-top-to-truncated-menu:8px;--spectrum-breadcrumbs-top-to-truncated-menu-compact:4px;--spectrum-avatar-size-50:16px;--spectrum-avatar-size-75:18px;--spectrum-avatar-size-100:20px;--spectrum-avatar-size-200:22px;--spectrum-avatar-size-300:26px;--spectrum-avatar-size-400:28px;--spectrum-avatar-size-500:32px;--spectrum-avatar-size-600:36px;--spectrum-avatar-size-700:40px;--spectrum-alert-banner-minimum-height:48px;--spectrum-alert-banner-width:832px;--spectrum-alert-banner-top-to-workflow-icon:15px;--spectrum-alert-banner-top-to-text:14px;--spectrum-alert-banner-bottom-to-text:17px;--spectrum-rating-indicator-width:18px;--spectrum-rating-indicator-to-icon:4px;--spectrum-color-area-width:192px;--spectrum-color-area-minimum-width:64px;--spectrum-color-area-height:192px;--spectrum-color-area-minimum-height:64px;--spectrum-color-wheel-width:192px;--spectrum-color-wheel-minimum-width:175px;--spectrum-color-slider-length:192px;--spectrum-color-slider-minimum-length:80px;--spectrum-illustrated-message-title-size:var(--spectrum-heading-size-m);--spectrum-illustrated-message-cjk-title-size:var(--spectrum-heading-cjk-size-m);--spectrum-illustrated-message-body-size:var(--spectrum-body-size-s);--spectrum-coach-mark-width:296px;--spectrum-coach-mark-minimum-width:296px;--spectrum-coach-mark-maximum-width:380px;--spectrum-coach-mark-edge-to-content:var(--spectrum-spacing-400);--spectrum-coach-mark-pagination-text-to-bottom-edge:33px;--spectrum-coach-mark-media-height:222px;--spectrum-coach-mark-media-minimum-height:166px;--spectrum-coach-mark-title-size:var(--spectrum-heading-size-xs);--spectrum-coach-mark-body-size:var(--spectrum-body-size-s);--spectrum-coach-mark-pagination-body-size:var(--spectrum-body-size-s);--spectrum-accordion-top-to-text-regular-small:5px;--spectrum-accordion-small-top-to-text-spacious:9px;--spectrum-accordion-top-to-text-regular-medium:8px;--spectrum-accordion-top-to-text-spacious-medium:12px;--spectrum-accordion-top-to-text-compact-large:4px;--spectrum-accordion-top-to-text-regular-large:9px;--spectrum-accordion-top-to-text-spacious-large:12px;--spectrum-accordion-top-to-text-compact-extra-large:5px;--spectrum-accordion-top-to-text-regular-extra-large:9px;--spectrum-accordion-top-to-text-spacious-extra-large:13px;--spectrum-accordion-bottom-to-text-compact-small:2px;--spectrum-accordion-bottom-to-text-regular-small:7px;--spectrum-accordion-bottom-to-text-spacious-small:11px;--spectrum-accordion-bottom-to-text-compact-medium:5px;--spectrum-accordion-bottom-to-text-regular-medium:9px;--spectrum-accordion-bottom-to-text-spacious-medium:13px;--spectrum-accordion-bottom-to-text-compact-large:8px;--spectrum-accordion-bottom-to-text-regular-large:11px;--spectrum-accordion-bottom-to-text-spacious-large:16px;--spectrum-accordion-bottom-to-text-compact-extra-large:8px;--spectrum-accordion-bottom-to-text-regular-extra-large:12px;--spectrum-accordion-bottom-to-text-spacious-extra-large:16px;--spectrum-accordion-minimum-width:200px;--spectrum-accordion-content-area-top-to-content:8px;--spectrum-accordion-content-area-bottom-to-content:16px;--spectrum-color-handle-size:16px;--spectrum-color-handle-size-key-focus:32px;--spectrum-table-column-header-row-top-to-text-small:8px;--spectrum-table-column-header-row-top-to-text-medium:7px;--spectrum-table-column-header-row-top-to-text-large:10px;--spectrum-table-column-header-row-top-to-text-extra-large:13px;--spectrum-table-column-header-row-bottom-to-text-small:9px;--spectrum-table-column-header-row-bottom-to-text-medium:8px;--spectrum-table-column-header-row-bottom-to-text-large:10px;--spectrum-table-column-header-row-bottom-to-text-extra-large:13px;--spectrum-table-row-height-small-regular:32px;--spectrum-table-row-height-medium-regular:40px;--spectrum-table-row-height-large-regular:48px;--spectrum-table-row-height-extra-large-regular:56px;--spectrum-table-row-height-small-spacious:40px;--spectrum-table-row-height-medium-spacious:48px;--spectrum-table-row-height-large-spacious:56px;--spectrum-table-row-height-extra-large-spacious:64px;--spectrum-table-row-top-to-text-small-regular:8px;--spectrum-table-row-top-to-text-medium-regular:11px;--spectrum-table-row-top-to-text-large-regular:14px;--spectrum-table-row-top-to-text-extra-large-regular:17px;--spectrum-table-row-bottom-to-text-small-regular:9px;--spectrum-table-row-bottom-to-text-medium-regular:12px;--spectrum-table-row-bottom-to-text-large-regular:14px;--spectrum-table-row-bottom-to-text-extra-large-regular:17px;--spectrum-table-row-top-to-text-small-spacious:12px;--spectrum-table-row-top-to-text-medium-spacious:15px;--spectrum-table-row-top-to-text-large-spacious:18px;--spectrum-table-row-top-to-text-extra-large-spacious:21px;--spectrum-table-row-bottom-to-text-small-spacious:13px;--spectrum-table-row-bottom-to-text-medium-spacious:16px;--spectrum-table-row-bottom-to-text-large-spacious:18px;--spectrum-table-row-bottom-to-text-extra-large-spacious:21px;--spectrum-table-checkbox-to-text:24px;--spectrum-table-header-row-checkbox-to-top-small:10px;--spectrum-table-header-row-checkbox-to-top-medium:9px;--spectrum-table-header-row-checkbox-to-top-large:12px;--spectrum-table-header-row-checkbox-to-top-extra-large:15px;--spectrum-table-row-checkbox-to-top-small-compact:6px;--spectrum-table-row-checkbox-to-top-small-regular:10px;--spectrum-table-row-checkbox-to-top-small-spacious:14px;--spectrum-table-row-checkbox-to-top-medium-compact:9px;--spectrum-table-row-checkbox-to-top-medium-regular:13px;--spectrum-table-row-checkbox-to-top-medium-spacious:17px;--spectrum-table-row-checkbox-to-top-large-compact:12px;--spectrum-table-row-checkbox-to-top-large-regular:16px;--spectrum-table-row-checkbox-to-top-large-spacious:20px;--spectrum-table-row-checkbox-to-top-extra-large-compact:15px;--spectrum-table-row-checkbox-to-top-extra-large-regular:19px;--spectrum-table-row-checkbox-to-top-extra-large-spacious:23px;--spectrum-table-section-header-row-height-small:24px;--spectrum-table-section-header-row-height-medium:32px;--spectrum-table-section-header-row-height-large:40px;--spectrum-table-section-header-row-height-extra-large:48px;--spectrum-table-thumbnail-to-top-minimum-small-compact:4px;--spectrum-table-thumbnail-to-top-minimum-medium-compact:5px;--spectrum-table-thumbnail-to-top-minimum-large-compact:7px;--spectrum-table-thumbnail-to-top-minimum-extra-large-compact:8px;--spectrum-table-thumbnail-to-top-minimum-small-regular:5px;--spectrum-table-thumbnail-to-top-minimum-medium-regular:7px;--spectrum-table-thumbnail-to-top-minimum-large-regular:8px;--spectrum-table-thumbnail-to-top-minimum-extra-large-regular:8px;--spectrum-table-thumbnail-to-top-minimum-small-spacious:7px;--spectrum-table-thumbnail-to-top-minimum-medium-spacious:8px;--spectrum-table-thumbnail-to-top-minimum-large-spacious:8px;--spectrum-table-thumbnail-to-top-minimum-extra-large-spacious:10px;--spectrum-tab-item-to-tab-item-horizontal-small:21px;--spectrum-tab-item-to-tab-item-horizontal-medium:24px;--spectrum-tab-item-to-tab-item-horizontal-large:27px;--spectrum-tab-item-to-tab-item-horizontal-extra-large:30px;--spectrum-tab-item-to-tab-item-vertical-small:4px;--spectrum-tab-item-to-tab-item-vertical-medium:4px;--spectrum-tab-item-to-tab-item-vertical-large:5px;--spectrum-tab-item-to-tab-item-vertical-extra-large:5px;--spectrum-tab-item-start-to-edge-small:12px;--spectrum-tab-item-start-to-edge-medium:12px;--spectrum-tab-item-start-to-edge-large:13px;--spectrum-tab-item-start-to-edge-extra-large:13px;--spectrum-tab-item-top-to-text-small:11px;--spectrum-tab-item-bottom-to-text-small:12px;--spectrum-tab-item-top-to-text-medium:14px;--spectrum-tab-item-bottom-to-text-medium:14px;--spectrum-tab-item-top-to-text-large:16px;--spectrum-tab-item-bottom-to-text-large:18px;--spectrum-tab-item-top-to-text-extra-large:19px;--spectrum-tab-item-bottom-to-text-extra-large:20px;--spectrum-tab-item-top-to-text-compact-small:4px;--spectrum-tab-item-bottom-to-text-compact-small:5px;--spectrum-tab-item-top-to-text-compact-medium:6px;--spectrum-tab-item-bottom-to-text-compact-medium:8px;--spectrum-tab-item-top-to-text-compact-large:10px;--spectrum-tab-item-bottom-to-text-compact-large:12px;--spectrum-tab-item-top-to-text-compact-extra-large:12px;--spectrum-tab-item-bottom-to-text-compact-extra-large:13px;--spectrum-tab-item-top-to-workflow-icon-small:13px;--spectrum-tab-item-top-to-workflow-icon-medium:15px;--spectrum-tab-item-top-to-workflow-icon-large:17px;--spectrum-tab-item-top-to-workflow-icon-extra-large:19px;--spectrum-tab-item-top-to-workflow-icon-compact-small:3px;--spectrum-tab-item-top-to-workflow-icon-compact-medium:7px;--spectrum-tab-item-top-to-workflow-icon-compact-large:9px;--spectrum-tab-item-top-to-workflow-icon-compact-extra-large:11px;--spectrum-tab-item-focus-indicator-gap-small:7px;--spectrum-tab-item-focus-indicator-gap-medium:8px;--spectrum-tab-item-focus-indicator-gap-large:9px;--spectrum-tab-item-focus-indicator-gap-extra-large:10px;--spectrum-side-navigation-width:192px;--spectrum-side-navigation-minimum-width:160px;--spectrum-side-navigation-maximum-width:240px;--spectrum-side-navigation-second-level-edge-to-text:24px;--spectrum-side-navigation-third-level-edge-to-text:36px;--spectrum-side-navigation-with-icon-second-level-edge-to-text:50px;--spectrum-side-navigation-with-icon-third-level-edge-to-text:62px;--spectrum-side-navigation-item-to-item:4px;--spectrum-side-navigation-item-to-header:24px;--spectrum-side-navigation-header-to-item:8px;--spectrum-side-navigation-bottom-to-text:8px;--spectrum-tray-top-to-content-area:4px;--spectrum-text-to-visual-50:6px;--spectrum-text-to-visual-75:7px;--spectrum-text-to-visual-100:8px;--spectrum-text-to-visual-200:9px;--spectrum-text-to-visual-300:10px;--spectrum-text-to-control-75:9px;--spectrum-text-to-control-100:10px;--spectrum-text-to-control-200:11px;--spectrum-text-to-control-300:13px;--spectrum-component-height-50:20px;--spectrum-component-height-75:24px;--spectrum-component-height-100:32px;--spectrum-component-height-200:40px;--spectrum-component-height-300:48px;--spectrum-component-height-400:56px;--spectrum-component-height-500:64px;--spectrum-component-pill-edge-to-visual-75:10px;--spectrum-component-pill-edge-to-visual-100:14px;--spectrum-component-pill-edge-to-visual-200:18px;--spectrum-component-pill-edge-to-visual-300:21px;--spectrum-component-pill-edge-to-visual-only-75:4px;--spectrum-component-pill-edge-to-visual-only-100:7px;--spectrum-component-pill-edge-to-visual-only-200:10px;--spectrum-component-pill-edge-to-visual-only-300:13px;--spectrum-component-pill-edge-to-text-75:12px;--spectrum-component-pill-edge-to-text-100:16px;--spectrum-component-pill-edge-to-text-200:20px;--spectrum-component-pill-edge-to-text-300:24px;--spectrum-component-edge-to-visual-50:6px;--spectrum-component-edge-to-visual-75:7px;--spectrum-component-edge-to-visual-100:10px;--spectrum-component-edge-to-visual-200:13px;--spectrum-component-edge-to-visual-300:15px;--spectrum-component-edge-to-visual-only-50:3px;--spectrum-component-edge-to-visual-only-75:4px;--spectrum-component-edge-to-visual-only-100:7px;--spectrum-component-edge-to-visual-only-200:10px;--spectrum-component-edge-to-visual-only-300:13px;--spectrum-component-edge-to-text-50:8px;--spectrum-component-edge-to-text-75:9px;--spectrum-component-edge-to-text-100:12px;--spectrum-component-edge-to-text-200:15px;--spectrum-component-edge-to-text-300:18px;--spectrum-component-top-to-workflow-icon-50:3px;--spectrum-component-top-to-workflow-icon-75:4px;--spectrum-component-top-to-workflow-icon-100:7px;--spectrum-component-top-to-workflow-icon-200:10px;--spectrum-component-top-to-workflow-icon-300:13px;--spectrum-component-top-to-text-50:3px;--spectrum-component-top-to-text-75:4px;--spectrum-component-top-to-text-100:6px;--spectrum-component-top-to-text-200:9px;--spectrum-component-top-to-text-300:12px;--spectrum-component-bottom-to-text-50:3px;--spectrum-component-bottom-to-text-75:5px;--spectrum-component-bottom-to-text-100:9px;--spectrum-component-bottom-to-text-200:11px;--spectrum-component-bottom-to-text-300:14px;--spectrum-component-to-menu-small:6px;--spectrum-component-to-menu-medium:6px;--spectrum-component-to-menu-large:7px;--spectrum-component-to-menu-extra-large:8px;--spectrum-field-edge-to-disclosure-icon-75:7px;--spectrum-field-edge-to-disclosure-icon-100:11px;--spectrum-field-edge-to-disclosure-icon-200:14px;--spectrum-field-edge-to-disclosure-icon-300:17px;--spectrum-field-end-edge-to-disclosure-icon-75:7px;--spectrum-field-end-edge-to-disclosure-icon-100:11px;--spectrum-field-end-edge-to-disclosure-icon-200:14px;--spectrum-field-end-edge-to-disclosure-icon-300:17px;--spectrum-field-top-to-disclosure-icon-75:7px;--spectrum-field-top-to-disclosure-icon-100:11px;--spectrum-field-top-to-disclosure-icon-200:14px;--spectrum-field-top-to-disclosure-icon-300:17px;--spectrum-field-top-to-alert-icon-small:4px;--spectrum-field-top-to-alert-icon-medium:7px;--spectrum-field-top-to-alert-icon-large:10px;--spectrum-field-top-to-alert-icon-extra-large:13px;--spectrum-field-top-to-validation-icon-small:7px;--spectrum-field-top-to-validation-icon-medium:11px;--spectrum-field-top-to-validation-icon-large:14px;--spectrum-field-top-to-validation-icon-extra-large:17px;--spectrum-field-top-to-progress-circle-small:4px;--spectrum-field-top-to-progress-circle-medium:8px;--spectrum-field-top-to-progress-circle-large:12px;--spectrum-field-top-to-progress-circle-extra-large:16px;--spectrum-field-edge-to-alert-icon-small:9px;--spectrum-field-edge-to-alert-icon-medium:12px;--spectrum-field-edge-to-alert-icon-large:15px;--spectrum-field-edge-to-alert-icon-extra-large:18px;--spectrum-field-edge-to-validation-icon-small:9px;--spectrum-field-edge-to-validation-icon-medium:12px;--spectrum-field-edge-to-validation-icon-large:15px;--spectrum-field-edge-to-validation-icon-extra-large:18px;--spectrum-field-text-to-alert-icon-small:8px;--spectrum-field-text-to-alert-icon-medium:12px;--spectrum-field-text-to-alert-icon-large:15px;--spectrum-field-text-to-alert-icon-extra-large:18px;--spectrum-field-text-to-validation-icon-small:8px;--spectrum-field-text-to-validation-icon-medium:12px;--spectrum-field-text-to-validation-icon-large:15px;--spectrum-field-text-to-validation-icon-extra-large:18px;--spectrum-field-width:192px;--spectrum-character-count-to-field-quiet-small:-3px;--spectrum-character-count-to-field-quiet-medium:-3px;--spectrum-character-count-to-field-quiet-large:-3px;--spectrum-character-count-to-field-quiet-extra-large:-4px;--spectrum-side-label-character-count-to-field:12px;--spectrum-side-label-character-count-top-margin-small:4px;--spectrum-side-label-character-count-top-margin-medium:8px;--spectrum-side-label-character-count-top-margin-large:11px;--spectrum-side-label-character-count-top-margin-extra-large:14px;--spectrum-disclosure-indicator-top-to-disclosure-icon-small:7px;--spectrum-disclosure-indicator-top-to-disclosure-icon-medium:11px;--spectrum-disclosure-indicator-top-to-disclosure-icon-large:14px;--spectrum-disclosure-indicator-top-to-disclosure-icon-extra-large:17px;--spectrum-navigational-indicator-top-to-back-icon-small:6px;--spectrum-navigational-indicator-top-to-back-icon-medium:9px;--spectrum-navigational-indicator-top-to-back-icon-large:12px;--spectrum-navigational-indicator-top-to-back-icon-extra-large:15px;--spectrum-color-control-track-width:24px;--spectrum-font-size-50:11px;--spectrum-font-size-75:12px;--spectrum-font-size-100:14px;--spectrum-font-size-200:16px;--spectrum-font-size-300:18px;--spectrum-font-size-400:20px;--spectrum-font-size-500:22px;--spectrum-font-size-600:25px;--spectrum-font-size-700:28px;--spectrum-font-size-800:32px;--spectrum-font-size-900:36px;--spectrum-font-size-1000:40px;--spectrum-font-size-1100:45px;--spectrum-font-size-1200:50px;--spectrum-font-size-1300:60px;--spectrum-slider-tick-mark-height:10px;--spectrum-slider-ramp-track-height:16px;--spectrum-colorwheel-path:"M 95 95 m -95 0 a 95 95 0 1 0 190 0 a 95 95 0 1 0 -190 0.2 M 95 95 m -73 0 a 73 73 0 1 0 146 0 a 73 73 0 1 0 -146 0";--spectrum-colorwheel-path-borders:"M 96 96 m -96 0 a 96 96 0 1 0 192 0 a 96 96 0 1 0 -192 0.2 M 96 96 m -72 0 a 72 72 0 1 0 144 0 a 72 72 0 1 0 -144 0";--spectrum-colorwheel-colorarea-container-size:144px;--spectrum-colorloupe-checkerboard-fill:url(#checkerboard-primary);--spectrum-menu-item-selectable-edge-to-text-not-selected-small:28px;--spectrum-menu-item-selectable-edge-to-text-not-selected-medium:32px;--spectrum-menu-item-selectable-edge-to-text-not-selected-large:38px;--spectrum-menu-item-selectable-edge-to-text-not-selected-extra-large:45px;--spectrum-menu-item-checkmark-height-small:10px;--spectrum-menu-item-checkmark-height-medium:10px;--spectrum-menu-item-checkmark-height-large:12px;--spectrum-menu-item-checkmark-height-extra-large:14px;--spectrum-menu-item-checkmark-width-small:10px;--spectrum-menu-item-checkmark-width-medium:10px;--spectrum-menu-item-checkmark-width-large:12px;--spectrum-menu-item-checkmark-width-extra-large:14px;--spectrum-rating-icon-spacing:var(--spectrum-spacing-75);--spectrum-button-top-to-text-small:5px;--spectrum-button-bottom-to-text-small:4px;--spectrum-button-top-to-text-medium:7px;--spectrum-button-bottom-to-text-medium:8px;--spectrum-button-top-to-text-large:10px;--spectrum-button-bottom-to-text-large:10px;--spectrum-button-top-to-text-extra-large:13px;--spectrum-button-bottom-to-text-extra-large:13px;--spectrum-alert-banner-close-button-spacing:var(--spectrum-spacing-100);--spectrum-alert-banner-edge-to-divider:var(--spectrum-spacing-100);--spectrum-alert-banner-edge-to-button:var(--spectrum-spacing-100);--spectrum-alert-banner-text-to-button-vertical:var(--spectrum-spacing-100);--spectrum-alert-dialog-padding:var(--spectrum-spacing-500);--spectrum-alert-dialog-description-to-buttons:var(--spectrum-spacing-700);--spectrum-coach-indicator-gap:6px;--spectrum-coach-indicator-ring-diameter:var(--spectrum-spacing-300);--spectrum-coach-indicator-quiet-ring-diameter:var(--spectrum-spacing-100);--spectrum-coachmark-buttongroup-display:flex;--spectrum-coachmark-buttongroup-mobile-display:none;--spectrum-coachmark-menu-display:inline-flex;--spectrum-coachmark-menu-mobile-display:none;--spectrum-well-padding:var(--spectrum-spacing-300);--spectrum-well-margin-top:var(--spectrum-spacing-75);--spectrum-well-min-width:240px;--spectrum-well-border-radius:var(--spectrum-spacing-75);--spectrum-workflow-icon-size-xxl:32px;--spectrum-workflow-icon-size-xxs:12px;--spectrum-treeview-item-indentation-medium:var(--spectrum-spacing-300);--spectrum-treeview-item-indentation-small:var(--spectrum-spacing-200);--spectrum-treeview-item-indentation-large:20px;--spectrum-treeview-item-indentation-extra-large:var(--spectrum-spacing-400);--spectrum-treeview-indicator-inset-block-start:5px;--spectrum-treeview-item-min-block-size-thumbnail-offset-medium:0px;--spectrum-dialog-confirm-entry-animation-distance:20px;--spectrum-dialog-confirm-hero-height:128px;--spectrum-dialog-confirm-border-radius:4px;--spectrum-dialog-confirm-title-text-size:18px;--spectrum-dialog-confirm-description-text-size:14px;--spectrum-dialog-confirm-padding-grid:40px;--spectrum-datepicker-initial-width:128px;--spectrum-datepicker-generic-padding:var(--spectrum-spacing-200);--spectrum-datepicker-dash-line-height:24px;--spectrum-datepicker-width-quiet-first:72px;--spectrum-datepicker-width-quiet-second:16px;--spectrum-datepicker-datetime-width-first:36px;--spectrum-datepicker-invalid-icon-to-button:8px;--spectrum-datepicker-invalid-icon-to-button-quiet:7px;--spectrum-datepicker-input-datetime-width:var(--spectrum-spacing-400);--spectrum-pagination-textfield-width:var(--spectrum-spacing-700);--spectrum-pagination-item-inline-spacing:5px;--spectrum-dial-border-radius:16px;--spectrum-dial-handle-position:8px;--spectrum-dial-handle-block-margin:16px;--spectrum-dial-handle-inline-margin:16px;--spectrum-dial-controls-margin:8px;--spectrum-dial-label-gap-y:5px;--spectrum-dial-label-container-top-to-text:4px;--spectrum-assetcard-focus-ring-border-radius:8px;--spectrum-assetcard-selectionindicator-margin:12px;--spectrum-assetcard-title-font-size:var(--spectrum-heading-size-xs);--spectrum-assetcard-header-content-font-size:var(--spectrum-heading-size-xs);--spectrum-assetcard-content-font-size:var(--spectrum-body-size-s);--spectrum-tooltip-animation-distance:var(--spectrum-spacing-75);--spectrum-ui-icon-medium-display:block;--spectrum-ui-icon-large-display:none;--spectrum-checkbox-control-size-small:12px;--spectrum-checkbox-control-size-medium:14px;--spectrum-checkbox-control-size-large:16px;--spectrum-checkbox-control-size-extra-large:18px;--spectrum-checkbox-top-to-control-small:6px;--spectrum-checkbox-top-to-control-medium:9px;--spectrum-checkbox-top-to-control-large:12px;--spectrum-checkbox-top-to-control-extra-large:15px;--spectrum-switch-control-width-small:23px;--spectrum-switch-control-width-medium:26px;--spectrum-switch-control-width-large:29px;--spectrum-switch-control-width-extra-large:33px;--spectrum-switch-control-height-small:12px;--spectrum-switch-control-height-medium:14px;--spectrum-switch-control-height-large:16px;--spectrum-switch-control-height-extra-large:18px;--spectrum-switch-top-to-control-small:6px;--spectrum-switch-top-to-control-medium:9px;--spectrum-switch-top-to-control-large:12px;--spectrum-switch-top-to-control-extra-large:15px;--spectrum-radio-button-control-size-small:12px;--spectrum-radio-button-control-size-medium:14px;--spectrum-radio-button-control-size-large:16px;--spectrum-radio-button-control-size-extra-large:18px;--spectrum-radio-button-top-to-control-small:6px;--spectrum-radio-button-top-to-control-medium:9px;--spectrum-radio-button-top-to-control-large:12px;--spectrum-radio-button-top-to-control-extra-large:15px;--spectrum-slider-control-height-small:14px;--spectrum-slider-control-height-medium:16px;--spectrum-slider-control-height-large:18px;--spectrum-slider-control-height-extra-large:20px;--spectrum-slider-handle-size-small:14px;--spectrum-slider-handle-size-medium:16px;--spectrum-slider-handle-size-large:18px;--spectrum-slider-handle-size-extra-large:20px;--spectrum-slider-handle-border-width-down-small:5px;--spectrum-slider-handle-border-width-down-medium:6px;--spectrum-slider-handle-border-width-down-large:7px;--spectrum-slider-handle-border-width-down-extra-large:8px;--spectrum-slider-bottom-to-handle-small:5px;--spectrum-slider-bottom-to-handle-medium:8px;--spectrum-slider-bottom-to-handle-large:11px;--spectrum-slider-bottom-to-handle-extra-large:14px;--spectrum-corner-radius-100:4px;--spectrum-corner-radius-200:8px;--spectrum-drop-shadow-y:1px;--spectrum-drop-shadow-blur:4px}:root,:host{--spectrum-global-alias-appframe-border-size:2px;--swc-scale-factor:1}
`;
var scale_medium_css_default = e19;

// ../node_modules/@spectrum-web-components/theme/src/Theme.js
init_src();
init_version();
var d12 = ["spectrum", "express", "spectrum-two"];
var c18 = ["medium", "large", "medium-express", "large-express", "medium-spectrum-two", "large-spectrum-two"];
var p17 = ["light", "lightest", "dark", "darkest", "light-express", "lightest-express", "dark-express", "darkest-express", "light-spectrum-two", "dark-spectrum-two"];
var r14 = class r15 extends HTMLElement {
  constructor() {
    super();
    this._dir = "";
    this._system = "spectrum";
    this._color = "";
    this._scale = "";
    this.trackedChildren = /* @__PURE__ */ new Set();
    this._updateRequested = false;
    this._contextConsumers = /* @__PURE__ */ new Map();
    this.attachShadow({ mode: "open" });
    const e22 = document.importNode(r15.template.content, true);
    this.shadowRoot.appendChild(e22), this.shouldAdoptStyles(), this.addEventListener("sp-query-theme", this.onQueryTheme), this.addEventListener("sp-language-context", this._handleContextPresence), this.updateComplete = this.__createDeferredPromise();
  }
  static get observedAttributes() {
    return ["color", "scale", "lang", "dir", "system", "theme"];
  }
  set dir(e22) {
    if (e22 === this.dir) return;
    this.setAttribute("dir", e22), this._dir = e22;
    const t16 = e22 === "rtl" ? e22 : "ltr";
    this.trackedChildren.forEach((s14) => {
      s14.setAttribute("dir", t16);
    });
  }
  get dir() {
    return this._dir;
  }
  attributeChangedCallback(e22, t16, s14) {
    t16 !== s14 && (e22 === "color" ? this.color = s14 : e22 === "scale" ? this.scale = s14 : e22 === "lang" && s14 ? (this.lang = s14, this._provideContext()) : e22 === "theme" ? this.theme = s14 : e22 === "system" ? this.system = s14 : e22 === "dir" && (this.dir = s14));
  }
  requestUpdate() {
    window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow ? window.ShadyCSS.styleElement(this) : this.shouldAdoptStyles();
  }
  get system() {
    const e22 = r15.themeFragmentsByKind.get("system"), { name: t16 } = e22 && e22.get("default") || {};
    return this._system || t16 || "";
  }
  set system(e22) {
    if (e22 === this._system) return;
    const t16 = e22 && d12.includes(e22) ? e22 : this.system;
    t16 !== this._system && (this._system = t16, this.requestUpdate()), t16 ? this.setAttribute("system", t16) : this.removeAttribute("system");
  }
  get theme() {
    return this.system || this.removeAttribute("system"), this.system;
  }
  set theme(e22) {
    this.system = e22, this.requestUpdate();
  }
  get color() {
    const e22 = r15.themeFragmentsByKind.get("color"), { name: t16 } = e22 && e22.get("default") || {};
    return this._color || t16 || "";
  }
  set color(e22) {
    if (e22 === this._color) return;
    const t16 = e22 && p17.includes(e22) ? e22 : this.color;
    t16 !== this._color && (this._color = t16, this.requestUpdate()), t16 ? this.setAttribute("color", t16) : this.removeAttribute("color");
  }
  get scale() {
    const e22 = r15.themeFragmentsByKind.get("scale"), { name: t16 } = e22 && e22.get("default") || {};
    return this._scale || t16 || "";
  }
  set scale(e22) {
    if (e22 === this._scale) return;
    const t16 = e22 && c18.includes(e22) ? e22 : this.scale;
    t16 !== this._scale && (this._scale = t16, this.requestUpdate()), t16 ? this.setAttribute("scale", t16) : this.removeAttribute("scale");
  }
  get styles() {
    const e22 = [...r15.themeFragmentsByKind.keys()], t16 = (a10, i20, n18) => {
      const o26 = n18 && n18 !== "theme" && n18 !== "system" && this.theme !== "spectrum" && this.system !== "spectrum" ? a10.get(`${i20}-${this.system}`) : a10.get(i20), l14 = i20 === "spectrum" || !n18 || this.hasAttribute(n18);
      if (o26 && l14) return o26.styles;
    };
    return [...e22.reduce((a10, i20) => {
      const n18 = r15.themeFragmentsByKind.get(i20);
      let o26;
      if (i20 === "app" || i20 === "core") o26 = t16(n18, i20);
      else {
        const { [i20]: l14 } = this;
        o26 = t16(n18, l14, i20);
      }
      return o26 && a10.push(o26), a10;
    }, [])];
  }
  static get template() {
    return this.templateElement || (this.templateElement = document.createElement("template"), this.templateElement.innerHTML = "<slot></slot>"), this.templateElement;
  }
  __createDeferredPromise() {
    return new Promise((e22) => {
      this.__resolve = e22;
    });
  }
  onQueryTheme(e22) {
    if (e22.defaultPrevented) return;
    e22.preventDefault();
    const { detail: t16 } = e22;
    t16.color = this.color || void 0, t16.scale = this.scale || void 0, t16.lang = this.lang || document.documentElement.lang || navigator.language, t16.theme = this.system || void 0, t16.system = this.system || void 0;
  }
  connectedCallback() {
    if (this.shouldAdoptStyles(), window.ShadyCSS !== void 0 && window.ShadyCSS.styleElement(this), r15.instances.add(this), !this.hasAttribute("dir")) {
      let e22 = this.assignedSlot || this.parentNode;
      for (; e22 !== document.documentElement && !(e22 instanceof r15); ) e22 = e22.assignedSlot || e22.parentNode || e22.host;
      this.dir = e22.dir === "rtl" ? e22.dir : "ltr";
    }
  }
  disconnectedCallback() {
    r15.instances.delete(this);
  }
  startManagingContentDirection(e22) {
    this.trackedChildren.add(e22);
  }
  stopManagingContentDirection(e22) {
    this.trackedChildren.delete(e22);
  }
  async shouldAdoptStyles() {
    this._updateRequested || (this.updateComplete = this.__createDeferredPromise(), this._updateRequested = true, this._updateRequested = await false, this.adoptStyles(), this.__resolve(true));
  }
  adoptStyles() {
    const e22 = this.styles;
    if (window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow && window.ShadyCSS.ScopingShim) {
      const t16 = [];
      for (const [s14, a10] of r15.themeFragmentsByKind) for (const [i20, { styles: n18 }] of a10) {
        if (i20 === "default") continue;
        let o26 = n18.cssText;
        r15.defaultFragments.has(i20) || (o26 = o26.replace(":host", `:host([${s14}='${i20}'])`)), t16.push(o26);
      }
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(t16, this.localName), window.ShadyCSS.prepareTemplate(r15.template, this.localName);
    } else if (e4) {
      const t16 = [];
      for (const s14 of e22) t16.push(s14.styleSheet);
      this.shadowRoot.adoptedStyleSheets = t16;
    } else this.shadowRoot.querySelectorAll("style").forEach((s14) => s14.remove()), e22.forEach((s14) => {
      const a10 = document.createElement("style");
      a10.textContent = s14.cssText, this.shadowRoot.appendChild(a10);
    });
  }
  static registerThemeFragment(e22, t16, s14) {
    const a10 = r15.themeFragmentsByKind.get(t16) || /* @__PURE__ */ new Map();
    a10.size === 0 && (r15.themeFragmentsByKind.set(t16, a10), a10.set("default", { name: e22, styles: s14 }), r15.defaultFragments.add(e22)), a10.set(e22, { name: e22, styles: s14 }), r15.instances.forEach((i20) => i20.shouldAdoptStyles());
  }
  _provideContext() {
    this._contextConsumers.forEach(([e22, t16]) => e22(this.lang, t16));
  }
  _handleContextPresence(e22) {
    e22.stopPropagation();
    const t16 = e22.composedPath()[0];
    if (this._contextConsumers.has(t16)) return;
    this._contextConsumers.set(t16, [e22.detail.callback, () => this._contextConsumers.delete(t16)]);
    const [s14, a10] = this._contextConsumers.get(t16) || [];
    s14 && a10 && s14(this.lang || document.documentElement.lang || navigator.language, a10);
  }
};
r14.themeFragmentsByKind = /* @__PURE__ */ new Map(), r14.defaultFragments = /* @__PURE__ */ new Set(["spectrum"]), r14.instances = /* @__PURE__ */ new Set(), r14.VERSION = version;
var Theme = r14;

// ../node_modules/@spectrum-web-components/theme/src/theme.css.js
init_src();
var e20 = i3`
            /*!
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
:root,:host{--spectrum-global-animation-linear:cubic-bezier(0,0,1,1);--spectrum-global-animation-duration-0:0s;--spectrum-global-animation-duration-100:.13s;--spectrum-global-animation-duration-200:.16s;--spectrum-global-animation-duration-300:.19s;--spectrum-global-animation-duration-400:.22s;--spectrum-global-animation-duration-500:.25s;--spectrum-global-animation-duration-600:.3s;--spectrum-global-animation-duration-700:.35s;--spectrum-global-animation-duration-800:.4s;--spectrum-global-animation-duration-900:.45s;--spectrum-global-animation-duration-1000:.5s;--spectrum-global-animation-duration-2000:1s;--spectrum-global-animation-duration-4000:2s;--spectrum-global-animation-ease-in-out:cubic-bezier(.45,0,.4,1);--spectrum-global-animation-ease-in:cubic-bezier(.5,0,1,1);--spectrum-global-animation-ease-out:cubic-bezier(0,0,.4,1);--spectrum-global-animation-ease-linear:cubic-bezier(0,0,1,1);--spectrum-global-color-status:Verified;--spectrum-global-color-version:5.1;--spectrum-global-color-static-black-rgb:0,0,0;--spectrum-global-color-static-black:rgb(var(--spectrum-global-color-static-black-rgb));--spectrum-global-color-static-white-rgb:255,255,255;--spectrum-global-color-static-white:rgb(var(--spectrum-global-color-static-white-rgb));--spectrum-global-color-static-blue-rgb:0,87,191;--spectrum-global-color-static-blue:rgb(var(--spectrum-global-color-static-blue-rgb));--spectrum-global-color-static-gray-50-rgb:255,255,255;--spectrum-global-color-static-gray-50:rgb(var(--spectrum-global-color-static-gray-50-rgb));--spectrum-global-color-static-gray-75-rgb:255,255,255;--spectrum-global-color-static-gray-75:rgb(var(--spectrum-global-color-static-gray-75-rgb));--spectrum-global-color-static-gray-100-rgb:255,255,255;--spectrum-global-color-static-gray-100:rgb(var(--spectrum-global-color-static-gray-100-rgb));--spectrum-global-color-static-gray-200-rgb:235,235,235;--spectrum-global-color-static-gray-200:rgb(var(--spectrum-global-color-static-gray-200-rgb));--spectrum-global-color-static-gray-300-rgb:217,217,217;--spectrum-global-color-static-gray-300:rgb(var(--spectrum-global-color-static-gray-300-rgb));--spectrum-global-color-static-gray-400-rgb:179,179,179;--spectrum-global-color-static-gray-400:rgb(var(--spectrum-global-color-static-gray-400-rgb));--spectrum-global-color-static-gray-500-rgb:146,146,146;--spectrum-global-color-static-gray-500:rgb(var(--spectrum-global-color-static-gray-500-rgb));--spectrum-global-color-static-gray-600-rgb:110,110,110;--spectrum-global-color-static-gray-600:rgb(var(--spectrum-global-color-static-gray-600-rgb));--spectrum-global-color-static-gray-700-rgb:71,71,71;--spectrum-global-color-static-gray-700:rgb(var(--spectrum-global-color-static-gray-700-rgb));--spectrum-global-color-static-gray-800-rgb:34,34,34;--spectrum-global-color-static-gray-800:rgb(var(--spectrum-global-color-static-gray-800-rgb));--spectrum-global-color-static-gray-900-rgb:0,0,0;--spectrum-global-color-static-gray-900:rgb(var(--spectrum-global-color-static-gray-900-rgb));--spectrum-global-color-static-red-400-rgb:237,64,48;--spectrum-global-color-static-red-400:rgb(var(--spectrum-global-color-static-red-400-rgb));--spectrum-global-color-static-red-500-rgb:217,28,21;--spectrum-global-color-static-red-500:rgb(var(--spectrum-global-color-static-red-500-rgb));--spectrum-global-color-static-red-600-rgb:187,2,2;--spectrum-global-color-static-red-600:rgb(var(--spectrum-global-color-static-red-600-rgb));--spectrum-global-color-static-red-700-rgb:154,0,0;--spectrum-global-color-static-red-700:rgb(var(--spectrum-global-color-static-red-700-rgb));--spectrum-global-color-static-red-800-rgb:124,0,0;--spectrum-global-color-static-red-800:rgb(var(--spectrum-global-color-static-red-800-rgb));--spectrum-global-color-static-orange-400-rgb:250,139,26;--spectrum-global-color-static-orange-400:rgb(var(--spectrum-global-color-static-orange-400-rgb));--spectrum-global-color-static-orange-500-rgb:233,117,0;--spectrum-global-color-static-orange-500:rgb(var(--spectrum-global-color-static-orange-500-rgb));--spectrum-global-color-static-orange-600-rgb:209,97,0;--spectrum-global-color-static-orange-600:rgb(var(--spectrum-global-color-static-orange-600-rgb));--spectrum-global-color-static-orange-700-rgb:182,80,0;--spectrum-global-color-static-orange-700:rgb(var(--spectrum-global-color-static-orange-700-rgb));--spectrum-global-color-static-orange-800-rgb:155,64,0;--spectrum-global-color-static-orange-800:rgb(var(--spectrum-global-color-static-orange-800-rgb));--spectrum-global-color-static-yellow-200-rgb:250,237,123;--spectrum-global-color-static-yellow-200:rgb(var(--spectrum-global-color-static-yellow-200-rgb));--spectrum-global-color-static-yellow-300-rgb:250,224,23;--spectrum-global-color-static-yellow-300:rgb(var(--spectrum-global-color-static-yellow-300-rgb));--spectrum-global-color-static-yellow-400-rgb:238,205,0;--spectrum-global-color-static-yellow-400:rgb(var(--spectrum-global-color-static-yellow-400-rgb));--spectrum-global-color-static-yellow-500-rgb:221,185,0;--spectrum-global-color-static-yellow-500:rgb(var(--spectrum-global-color-static-yellow-500-rgb));--spectrum-global-color-static-yellow-600-rgb:201,164,0;--spectrum-global-color-static-yellow-600:rgb(var(--spectrum-global-color-static-yellow-600-rgb));--spectrum-global-color-static-yellow-700-rgb:181,144,0;--spectrum-global-color-static-yellow-700:rgb(var(--spectrum-global-color-static-yellow-700-rgb));--spectrum-global-color-static-yellow-800-rgb:160,125,0;--spectrum-global-color-static-yellow-800:rgb(var(--spectrum-global-color-static-yellow-800-rgb));--spectrum-global-color-static-chartreuse-300-rgb:176,222,27;--spectrum-global-color-static-chartreuse-300:rgb(var(--spectrum-global-color-static-chartreuse-300-rgb));--spectrum-global-color-static-chartreuse-400-rgb:157,203,13;--spectrum-global-color-static-chartreuse-400:rgb(var(--spectrum-global-color-static-chartreuse-400-rgb));--spectrum-global-color-static-chartreuse-500-rgb:139,182,4;--spectrum-global-color-static-chartreuse-500:rgb(var(--spectrum-global-color-static-chartreuse-500-rgb));--spectrum-global-color-static-chartreuse-600-rgb:122,162,0;--spectrum-global-color-static-chartreuse-600:rgb(var(--spectrum-global-color-static-chartreuse-600-rgb));--spectrum-global-color-static-chartreuse-700-rgb:106,141,0;--spectrum-global-color-static-chartreuse-700:rgb(var(--spectrum-global-color-static-chartreuse-700-rgb));--spectrum-global-color-static-chartreuse-800-rgb:90,120,0;--spectrum-global-color-static-chartreuse-800:rgb(var(--spectrum-global-color-static-chartreuse-800-rgb));--spectrum-global-color-static-celery-200-rgb:126,229,114;--spectrum-global-color-static-celery-200:rgb(var(--spectrum-global-color-static-celery-200-rgb));--spectrum-global-color-static-celery-300-rgb:87,212,86;--spectrum-global-color-static-celery-300:rgb(var(--spectrum-global-color-static-celery-300-rgb));--spectrum-global-color-static-celery-400-rgb:48,193,61;--spectrum-global-color-static-celery-400:rgb(var(--spectrum-global-color-static-celery-400-rgb));--spectrum-global-color-static-celery-500-rgb:15,172,38;--spectrum-global-color-static-celery-500:rgb(var(--spectrum-global-color-static-celery-500-rgb));--spectrum-global-color-static-celery-600-rgb:0,150,20;--spectrum-global-color-static-celery-600:rgb(var(--spectrum-global-color-static-celery-600-rgb));--spectrum-global-color-static-celery-700-rgb:0,128,15;--spectrum-global-color-static-celery-700:rgb(var(--spectrum-global-color-static-celery-700-rgb));--spectrum-global-color-static-celery-800-rgb:0,107,15;--spectrum-global-color-static-celery-800:rgb(var(--spectrum-global-color-static-celery-800-rgb));--spectrum-global-color-static-green-400-rgb:29,169,115;--spectrum-global-color-static-green-400:rgb(var(--spectrum-global-color-static-green-400-rgb));--spectrum-global-color-static-green-500-rgb:0,148,97;--spectrum-global-color-static-green-500:rgb(var(--spectrum-global-color-static-green-500-rgb));--spectrum-global-color-static-green-600-rgb:0,126,80;--spectrum-global-color-static-green-600:rgb(var(--spectrum-global-color-static-green-600-rgb));--spectrum-global-color-static-green-700-rgb:0,105,65;--spectrum-global-color-static-green-700:rgb(var(--spectrum-global-color-static-green-700-rgb));--spectrum-global-color-static-green-800-rgb:0,86,53;--spectrum-global-color-static-green-800:rgb(var(--spectrum-global-color-static-green-800-rgb));--spectrum-global-color-static-seafoam-200-rgb:75,206,199;--spectrum-global-color-static-seafoam-200:rgb(var(--spectrum-global-color-static-seafoam-200-rgb));--spectrum-global-color-static-seafoam-300-rgb:32,187,180;--spectrum-global-color-static-seafoam-300:rgb(var(--spectrum-global-color-static-seafoam-300-rgb));--spectrum-global-color-static-seafoam-400-rgb:0,166,160;--spectrum-global-color-static-seafoam-400:rgb(var(--spectrum-global-color-static-seafoam-400-rgb));--spectrum-global-color-static-seafoam-500-rgb:0,145,139;--spectrum-global-color-static-seafoam-500:rgb(var(--spectrum-global-color-static-seafoam-500-rgb));--spectrum-global-color-static-seafoam-600-rgb:0,124,118;--spectrum-global-color-static-seafoam-600:rgb(var(--spectrum-global-color-static-seafoam-600-rgb));--spectrum-global-color-static-seafoam-700-rgb:0,103,99;--spectrum-global-color-static-seafoam-700:rgb(var(--spectrum-global-color-static-seafoam-700-rgb));--spectrum-global-color-static-seafoam-800-rgb:10,83,80;--spectrum-global-color-static-seafoam-800:rgb(var(--spectrum-global-color-static-seafoam-800-rgb));--spectrum-global-color-static-blue-200-rgb:130,193,251;--spectrum-global-color-static-blue-200:rgb(var(--spectrum-global-color-static-blue-200-rgb));--spectrum-global-color-static-blue-300-rgb:98,173,247;--spectrum-global-color-static-blue-300:rgb(var(--spectrum-global-color-static-blue-300-rgb));--spectrum-global-color-static-blue-400-rgb:66,151,244;--spectrum-global-color-static-blue-400:rgb(var(--spectrum-global-color-static-blue-400-rgb));--spectrum-global-color-static-blue-500-rgb:27,127,245;--spectrum-global-color-static-blue-500:rgb(var(--spectrum-global-color-static-blue-500-rgb));--spectrum-global-color-static-blue-600-rgb:4,105,227;--spectrum-global-color-static-blue-600:rgb(var(--spectrum-global-color-static-blue-600-rgb));--spectrum-global-color-static-blue-700-rgb:0,87,190;--spectrum-global-color-static-blue-700:rgb(var(--spectrum-global-color-static-blue-700-rgb));--spectrum-global-color-static-blue-800-rgb:0,72,153;--spectrum-global-color-static-blue-800:rgb(var(--spectrum-global-color-static-blue-800-rgb));--spectrum-global-color-static-indigo-200-rgb:178,181,255;--spectrum-global-color-static-indigo-200:rgb(var(--spectrum-global-color-static-indigo-200-rgb));--spectrum-global-color-static-indigo-300-rgb:155,159,255;--spectrum-global-color-static-indigo-300:rgb(var(--spectrum-global-color-static-indigo-300-rgb));--spectrum-global-color-static-indigo-400-rgb:132,137,253;--spectrum-global-color-static-indigo-400:rgb(var(--spectrum-global-color-static-indigo-400-rgb));--spectrum-global-color-static-indigo-500-rgb:109,115,246;--spectrum-global-color-static-indigo-500:rgb(var(--spectrum-global-color-static-indigo-500-rgb));--spectrum-global-color-static-indigo-600-rgb:87,93,232;--spectrum-global-color-static-indigo-600:rgb(var(--spectrum-global-color-static-indigo-600-rgb));--spectrum-global-color-static-indigo-700-rgb:68,74,208;--spectrum-global-color-static-indigo-700:rgb(var(--spectrum-global-color-static-indigo-700-rgb));--spectrum-global-color-static-indigo-800-rgb:68,74,208;--spectrum-global-color-static-indigo-800:rgb(var(--spectrum-global-color-static-indigo-800-rgb));--spectrum-global-color-static-purple-400-rgb:178,121,250;--spectrum-global-color-static-purple-400:rgb(var(--spectrum-global-color-static-purple-400-rgb));--spectrum-global-color-static-purple-500-rgb:161,93,246;--spectrum-global-color-static-purple-500:rgb(var(--spectrum-global-color-static-purple-500-rgb));--spectrum-global-color-static-purple-600-rgb:142,67,234;--spectrum-global-color-static-purple-600:rgb(var(--spectrum-global-color-static-purple-600-rgb));--spectrum-global-color-static-purple-700-rgb:120,43,216;--spectrum-global-color-static-purple-700:rgb(var(--spectrum-global-color-static-purple-700-rgb));--spectrum-global-color-static-purple-800-rgb:98,23,190;--spectrum-global-color-static-purple-800:rgb(var(--spectrum-global-color-static-purple-800-rgb));--spectrum-global-color-static-fuchsia-400-rgb:228,93,230;--spectrum-global-color-static-fuchsia-400:rgb(var(--spectrum-global-color-static-fuchsia-400-rgb));--spectrum-global-color-static-fuchsia-500-rgb:211,63,212;--spectrum-global-color-static-fuchsia-500:rgb(var(--spectrum-global-color-static-fuchsia-500-rgb));--spectrum-global-color-static-fuchsia-600-rgb:188,39,187;--spectrum-global-color-static-fuchsia-600:rgb(var(--spectrum-global-color-static-fuchsia-600-rgb));--spectrum-global-color-static-fuchsia-700-rgb:163,10,163;--spectrum-global-color-static-fuchsia-700:rgb(var(--spectrum-global-color-static-fuchsia-700-rgb));--spectrum-global-color-static-fuchsia-800-rgb:135,0,136;--spectrum-global-color-static-fuchsia-800:rgb(var(--spectrum-global-color-static-fuchsia-800-rgb));--spectrum-global-color-static-magenta-200-rgb:253,127,175;--spectrum-global-color-static-magenta-200:rgb(var(--spectrum-global-color-static-magenta-200-rgb));--spectrum-global-color-static-magenta-300-rgb:242,98,157;--spectrum-global-color-static-magenta-300:rgb(var(--spectrum-global-color-static-magenta-300-rgb));--spectrum-global-color-static-magenta-400-rgb:226,68,135;--spectrum-global-color-static-magenta-400:rgb(var(--spectrum-global-color-static-magenta-400-rgb));--spectrum-global-color-static-magenta-500-rgb:205,40,111;--spectrum-global-color-static-magenta-500:rgb(var(--spectrum-global-color-static-magenta-500-rgb));--spectrum-global-color-static-magenta-600-rgb:179,15,89;--spectrum-global-color-static-magenta-600:rgb(var(--spectrum-global-color-static-magenta-600-rgb));--spectrum-global-color-static-magenta-700-rgb:149,0,72;--spectrum-global-color-static-magenta-700:rgb(var(--spectrum-global-color-static-magenta-700-rgb));--spectrum-global-color-static-magenta-800-rgb:119,0,58;--spectrum-global-color-static-magenta-800:rgb(var(--spectrum-global-color-static-magenta-800-rgb));--spectrum-global-color-static-transparent-white-200:#ffffff1a;--spectrum-global-color-static-transparent-white-300:#ffffff40;--spectrum-global-color-static-transparent-white-400:#fff6;--spectrum-global-color-static-transparent-white-500:#ffffff8c;--spectrum-global-color-static-transparent-white-600:#ffffffb3;--spectrum-global-color-static-transparent-white-700:#fffc;--spectrum-global-color-static-transparent-white-800:#ffffffe6;--spectrum-global-color-static-transparent-white-900-rgb:255,255,255;--spectrum-global-color-static-transparent-white-900:rgb(var(--spectrum-global-color-static-transparent-white-900-rgb));--spectrum-global-color-static-transparent-black-200:#0000001a;--spectrum-global-color-static-transparent-black-300:#00000040;--spectrum-global-color-static-transparent-black-400:#0006;--spectrum-global-color-static-transparent-black-500:#0000008c;--spectrum-global-color-static-transparent-black-600:#000000b3;--spectrum-global-color-static-transparent-black-700:#000c;--spectrum-global-color-static-transparent-black-800:#000000e6;--spectrum-global-color-static-transparent-black-900-rgb:0,0,0;--spectrum-global-color-static-transparent-black-900:rgb(var(--spectrum-global-color-static-transparent-black-900-rgb));--spectrum-global-color-sequential-cerulean:#e9fff1,#c8f1e4,#a5e3d7,#82d5ca,#68c5c1,#54b4ba,#3fa2b2,#2991ac,#2280a2,#1f6d98,#1d5c8d,#1a4b83,#1a3979,#1a266f,#191264,#180057;--spectrum-global-color-sequential-forest:#ffffdf,#e2f6ba,#c4eb95,#a4e16d,#8dd366,#77c460,#5fb65a,#48a754,#36984f,#2c894d,#237a4a,#196b47,#105c45,#094d41,#033f3e,#00313a;--spectrum-global-color-sequential-rose:#fff4dd,#ffddd7,#ffc5d2,#feaecb,#fa96c4,#f57ebd,#ef64b5,#e846ad,#d238a1,#bb2e96,#a3248c,#8a1b83,#71167c,#560f74,#370b6e,#000968;--spectrum-global-color-diverging-orange-yellow-seafoam:#580000,#79260b,#9c4511,#bd651a,#dd8629,#f5ad52,#fed693,#ffffe0,#bbe4d1,#76c7be,#3ea8a6,#208288,#076769,#00494b,#002c2d;--spectrum-global-color-diverging-red-yellow-blue:#4a001e,#751232,#a52747,#c65154,#e47961,#f0a882,#fad4ac,#ffffe0,#bce2cf,#89c0c4,#579eb9,#397aa8,#1c5796,#163771,#10194d;--spectrum-global-color-diverging-red-blue:#4a001e,#731331,#9f2945,#cc415a,#e06e85,#ed9ab0,#f8c3d9,#faf0ff,#c6d0f2,#92b2de,#5d94cb,#2f74b3,#265191,#163670,#0b194c;--spectrum-semantic-negative-background-color:var(--spectrum-global-color-static-red-600);--spectrum-semantic-negative-color-default:var(--spectrum-global-color-red-500);--spectrum-semantic-negative-color-hover:var(--spectrum-global-color-red-600);--spectrum-semantic-negative-color-dark:var(--spectrum-global-color-red-600);--spectrum-semantic-negative-border-color:var(--spectrum-global-color-red-400);--spectrum-semantic-negative-icon-color:var(--spectrum-global-color-red-600);--spectrum-semantic-negative-status-color:var(--spectrum-global-color-red-400);--spectrum-semantic-negative-text-color-large:var(--spectrum-global-color-red-500);--spectrum-semantic-negative-text-color-small:var(--spectrum-global-color-red-600);--spectrum-semantic-negative-text-color-small-hover:var(--spectrum-global-color-red-700);--spectrum-semantic-negative-text-color-small-down:var(--spectrum-global-color-red-700);--spectrum-semantic-negative-text-color-small-key-focus:var(--spectrum-global-color-red-600);--spectrum-semantic-negative-color-down:var(--spectrum-global-color-red-700);--spectrum-semantic-negative-color-key-focus:var(--spectrum-global-color-red-400);--spectrum-semantic-negative-background-color-default:var(--spectrum-global-color-static-red-600);--spectrum-semantic-negative-background-color-hover:var(--spectrum-global-color-static-red-700);--spectrum-semantic-negative-background-color-down:var(--spectrum-global-color-static-red-800);--spectrum-semantic-negative-background-color-key-focus:var(--spectrum-global-color-static-red-700);--spectrum-semantic-notice-background-color:var(--spectrum-global-color-static-orange-600);--spectrum-semantic-notice-color-default:var(--spectrum-global-color-orange-500);--spectrum-semantic-notice-color-dark:var(--spectrum-global-color-orange-600);--spectrum-semantic-notice-border-color:var(--spectrum-global-color-orange-400);--spectrum-semantic-notice-icon-color:var(--spectrum-global-color-orange-600);--spectrum-semantic-notice-status-color:var(--spectrum-global-color-orange-400);--spectrum-semantic-notice-text-color-large:var(--spectrum-global-color-orange-500);--spectrum-semantic-notice-text-color-small:var(--spectrum-global-color-orange-600);--spectrum-semantic-notice-color-down:var(--spectrum-global-color-orange-700);--spectrum-semantic-notice-color-key-focus:var(--spectrum-global-color-orange-400);--spectrum-semantic-notice-background-color-default:var(--spectrum-global-color-static-orange-600);--spectrum-semantic-notice-background-color-hover:var(--spectrum-global-color-static-orange-700);--spectrum-semantic-notice-background-color-down:var(--spectrum-global-color-static-orange-800);--spectrum-semantic-notice-background-color-key-focus:var(--spectrum-global-color-static-orange-700);--spectrum-semantic-positive-background-color:var(--spectrum-global-color-static-green-600);--spectrum-semantic-positive-color-default:var(--spectrum-global-color-green-500);--spectrum-semantic-positive-color-dark:var(--spectrum-global-color-green-600);--spectrum-semantic-positive-border-color:var(--spectrum-global-color-green-400);--spectrum-semantic-positive-icon-color:var(--spectrum-global-color-green-600);--spectrum-semantic-positive-status-color:var(--spectrum-global-color-green-400);--spectrum-semantic-positive-text-color-large:var(--spectrum-global-color-green-500);--spectrum-semantic-positive-text-color-small:var(--spectrum-global-color-green-600);--spectrum-semantic-positive-color-down:var(--spectrum-global-color-green-700);--spectrum-semantic-positive-color-key-focus:var(--spectrum-global-color-green-400);--spectrum-semantic-positive-background-color-default:var(--spectrum-global-color-static-green-600);--spectrum-semantic-positive-background-color-hover:var(--spectrum-global-color-static-green-700);--spectrum-semantic-positive-background-color-down:var(--spectrum-global-color-static-green-800);--spectrum-semantic-positive-background-color-key-focus:var(--spectrum-global-color-static-green-700);--spectrum-semantic-informative-background-color:var(--spectrum-global-color-static-blue-600);--spectrum-semantic-informative-color-default:var(--spectrum-global-color-blue-500);--spectrum-semantic-informative-color-dark:var(--spectrum-global-color-blue-600);--spectrum-semantic-informative-border-color:var(--spectrum-global-color-blue-400);--spectrum-semantic-informative-icon-color:var(--spectrum-global-color-blue-600);--spectrum-semantic-informative-status-color:var(--spectrum-global-color-blue-400);--spectrum-semantic-informative-text-color-large:var(--spectrum-global-color-blue-500);--spectrum-semantic-informative-text-color-small:var(--spectrum-global-color-blue-600);--spectrum-semantic-informative-color-down:var(--spectrum-global-color-blue-700);--spectrum-semantic-informative-color-key-focus:var(--spectrum-global-color-blue-400);--spectrum-semantic-informative-background-color-default:var(--spectrum-global-color-static-blue-600);--spectrum-semantic-informative-background-color-hover:var(--spectrum-global-color-static-blue-700);--spectrum-semantic-informative-background-color-down:var(--spectrum-global-color-static-blue-800);--spectrum-semantic-informative-background-color-key-focus:var(--spectrum-global-color-static-blue-700);--spectrum-semantic-cta-background-color-default:var(--spectrum-global-color-static-blue-600);--spectrum-semantic-cta-background-color-hover:var(--spectrum-global-color-static-blue-700);--spectrum-semantic-cta-background-color-down:var(--spectrum-global-color-static-blue-800);--spectrum-semantic-cta-background-color-key-focus:var(--spectrum-global-color-static-blue-700);--spectrum-semantic-emphasized-border-color-default:var(--spectrum-global-color-blue-500);--spectrum-semantic-emphasized-border-color-hover:var(--spectrum-global-color-blue-600);--spectrum-semantic-emphasized-border-color-down:var(--spectrum-global-color-blue-700);--spectrum-semantic-emphasized-border-color-key-focus:var(--spectrum-global-color-blue-600);--spectrum-semantic-neutral-background-color-default:var(--spectrum-global-color-static-gray-700);--spectrum-semantic-neutral-background-color-hover:var(--spectrum-global-color-static-gray-800);--spectrum-semantic-neutral-background-color-down:var(--spectrum-global-color-static-gray-900);--spectrum-semantic-neutral-background-color-key-focus:var(--spectrum-global-color-static-gray-800);--spectrum-semantic-presence-color-1:var(--spectrum-global-color-static-red-500);--spectrum-semantic-presence-color-2:var(--spectrum-global-color-static-orange-400);--spectrum-semantic-presence-color-3:var(--spectrum-global-color-static-yellow-400);--spectrum-semantic-presence-color-4-rgb:75,204,162;--spectrum-semantic-presence-color-4:rgb(var(--spectrum-semantic-presence-color-4-rgb));--spectrum-semantic-presence-color-5-rgb:0,199,255;--spectrum-semantic-presence-color-5:rgb(var(--spectrum-semantic-presence-color-5-rgb));--spectrum-semantic-presence-color-6-rgb:0,140,184;--spectrum-semantic-presence-color-6:rgb(var(--spectrum-semantic-presence-color-6-rgb));--spectrum-semantic-presence-color-7-rgb:126,75,243;--spectrum-semantic-presence-color-7:rgb(var(--spectrum-semantic-presence-color-7-rgb));--spectrum-semantic-presence-color-8:var(--spectrum-global-color-static-fuchsia-600);--spectrum-global-dimension-static-percent-50:50%;--spectrum-global-dimension-static-percent-70:70%;--spectrum-global-dimension-static-percent-100:100%;--spectrum-global-dimension-static-breakpoint-xsmall:304px;--spectrum-global-dimension-static-breakpoint-small:768px;--spectrum-global-dimension-static-breakpoint-medium:1280px;--spectrum-global-dimension-static-breakpoint-large:1768px;--spectrum-global-dimension-static-breakpoint-xlarge:2160px;--spectrum-global-dimension-static-grid-columns:12;--spectrum-global-dimension-static-grid-fluid-width:100%;--spectrum-global-dimension-static-grid-fixed-max-width:1280px;--spectrum-global-dimension-static-size-0:0px;--spectrum-global-dimension-static-size-10:1px;--spectrum-global-dimension-static-size-25:2px;--spectrum-global-dimension-static-size-40:3px;--spectrum-global-dimension-static-size-50:4px;--spectrum-global-dimension-static-size-65:5px;--spectrum-global-dimension-static-size-75:6px;--spectrum-global-dimension-static-size-85:7px;--spectrum-global-dimension-static-size-100:8px;--spectrum-global-dimension-static-size-115:9px;--spectrum-global-dimension-static-size-125:10px;--spectrum-global-dimension-static-size-130:11px;--spectrum-global-dimension-static-size-150:12px;--spectrum-global-dimension-static-size-160:13px;--spectrum-global-dimension-static-size-175:14px;--spectrum-global-dimension-static-size-185:15px;--spectrum-global-dimension-static-size-200:16px;--spectrum-global-dimension-static-size-225:18px;--spectrum-global-dimension-static-size-250:20px;--spectrum-global-dimension-static-size-275:22px;--spectrum-global-dimension-static-size-300:24px;--spectrum-global-dimension-static-size-325:26px;--spectrum-global-dimension-static-size-350:28px;--spectrum-global-dimension-static-size-400:32px;--spectrum-global-dimension-static-size-450:36px;--spectrum-global-dimension-static-size-500:40px;--spectrum-global-dimension-static-size-550:44px;--spectrum-global-dimension-static-size-600:48px;--spectrum-global-dimension-static-size-700:56px;--spectrum-global-dimension-static-size-800:64px;--spectrum-global-dimension-static-size-900:72px;--spectrum-global-dimension-static-size-1000:80px;--spectrum-global-dimension-static-size-1200:96px;--spectrum-global-dimension-static-size-1700:136px;--spectrum-global-dimension-static-size-2400:192px;--spectrum-global-dimension-static-size-2500:200px;--spectrum-global-dimension-static-size-2600:208px;--spectrum-global-dimension-static-size-2800:224px;--spectrum-global-dimension-static-size-3200:256px;--spectrum-global-dimension-static-size-3400:272px;--spectrum-global-dimension-static-size-3500:280px;--spectrum-global-dimension-static-size-3600:288px;--spectrum-global-dimension-static-size-3800:304px;--spectrum-global-dimension-static-size-4600:368px;--spectrum-global-dimension-static-size-5000:400px;--spectrum-global-dimension-static-size-6000:480px;--spectrum-global-dimension-static-size-16000:1280px;--spectrum-global-dimension-static-font-size-50:11px;--spectrum-global-dimension-static-font-size-75:12px;--spectrum-global-dimension-static-font-size-100:14px;--spectrum-global-dimension-static-font-size-150:15px;--spectrum-global-dimension-static-font-size-200:16px;--spectrum-global-dimension-static-font-size-300:18px;--spectrum-global-dimension-static-font-size-400:20px;--spectrum-global-dimension-static-font-size-500:22px;--spectrum-global-dimension-static-font-size-600:25px;--spectrum-global-dimension-static-font-size-700:28px;--spectrum-global-dimension-static-font-size-800:32px;--spectrum-global-dimension-static-font-size-900:36px;--spectrum-global-dimension-static-font-size-1000:40px;--spectrum-global-font-family-base:adobe-clean,"Source Sans Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-global-font-family-serif:adobe-clean-serif,"Source Serif Pro",Georgia,serif;--spectrum-global-font-family-code:"Source Code Pro",Monaco,monospace;--spectrum-global-font-weight-thin:100;--spectrum-global-font-weight-ultra-light:200;--spectrum-global-font-weight-light:300;--spectrum-global-font-weight-regular:400;--spectrum-global-font-weight-medium:500;--spectrum-global-font-weight-semi-bold:600;--spectrum-global-font-weight-bold:700;--spectrum-global-font-weight-extra-bold:800;--spectrum-global-font-weight-black:900;--spectrum-global-font-style-regular:normal;--spectrum-global-font-style-italic:italic;--spectrum-global-font-letter-spacing-none:0;--spectrum-global-font-letter-spacing-small:.0125em;--spectrum-global-font-letter-spacing-han:.05em;--spectrum-global-font-letter-spacing-medium:.06em;--spectrum-global-font-line-height-large:1.7;--spectrum-global-font-line-height-medium:1.5;--spectrum-global-font-line-height-small:1.3;--spectrum-global-font-multiplier-0:0em;--spectrum-global-font-multiplier-25:.25em;--spectrum-global-font-multiplier-75:.75em;--spectrum-global-font-font-family-ar:myriad-arabic,adobe-clean,"Source Sans Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-global-font-font-family-he:myriad-hebrew,adobe-clean,"Source Sans Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-global-font-font-family-zh:adobe-clean-han-traditional,source-han-traditional,"MingLiu","Heiti TC Light","sans-serif";--spectrum-global-font-font-family-zhhans:adobe-clean-han-simplified-c,source-han-simplified-c,"SimSun","Heiti SC Light","sans-serif";--spectrum-global-font-font-family-ko:adobe-clean-han-korean,source-han-korean,"Malgun Gothic","Apple Gothic","sans-serif";--spectrum-global-font-font-family-ja:adobe-clean-han-japanese,"Hiragino Kaku Gothic ProN","ヒラギノ角ゴ ProN W3","Osaka",YuGothic,"Yu Gothic","メイリオ",Meiryo,"ＭＳ Ｐゴシック","MS PGothic","sans-serif";--spectrum-global-font-font-family-condensed:adobe-clean-han-traditional,source-han-traditional,"MingLiu","Heiti TC Light",adobe-clean,"Source Sans Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-alias-border-size-thin:var(--spectrum-global-dimension-static-size-10);--spectrum-alias-border-size-thick:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-border-size-thicker:var(--spectrum-global-dimension-static-size-50);--spectrum-alias-border-size-thickest:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-border-offset-thin:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-border-offset-thick:var(--spectrum-global-dimension-static-size-50);--spectrum-alias-border-offset-thicker:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-border-offset-thickest:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-grid-baseline:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-grid-gutter-xsmall:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-grid-gutter-small:var(--spectrum-global-dimension-static-size-300);--spectrum-alias-grid-gutter-medium:var(--spectrum-global-dimension-static-size-400);--spectrum-alias-grid-gutter-large:var(--spectrum-global-dimension-static-size-500);--spectrum-alias-grid-gutter-xlarge:var(--spectrum-global-dimension-static-size-600);--spectrum-alias-grid-margin-xsmall:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-grid-margin-small:var(--spectrum-global-dimension-static-size-300);--spectrum-alias-grid-margin-medium:var(--spectrum-global-dimension-static-size-400);--spectrum-alias-grid-margin-large:var(--spectrum-global-dimension-static-size-500);--spectrum-alias-grid-margin-xlarge:var(--spectrum-global-dimension-static-size-600);--spectrum-alias-grid-layout-region-margin-bottom-xsmall:var(--spectrum-global-dimension-static-size-200);--spectrum-alias-grid-layout-region-margin-bottom-small:var(--spectrum-global-dimension-static-size-300);--spectrum-alias-grid-layout-region-margin-bottom-medium:var(--spectrum-global-dimension-static-size-400);--spectrum-alias-grid-layout-region-margin-bottom-large:var(--spectrum-global-dimension-static-size-500);--spectrum-alias-grid-layout-region-margin-bottom-xlarge:var(--spectrum-global-dimension-static-size-600);--spectrum-alias-radial-reaction-size-default:var(--spectrum-global-dimension-static-size-550);--spectrum-alias-focus-ring-gap:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-focus-ring-size:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-loupe-entry-animation-duration:var(--spectrum-global-animation-duration-300);--spectrum-alias-loupe-exit-animation-duration:var(--spectrum-global-animation-duration-300);--spectrum-alias-heading-text-line-height:var(--spectrum-global-font-line-height-small);--spectrum-alias-heading-text-font-weight-regular:var(--spectrum-global-font-weight-bold);--spectrum-alias-heading-text-font-weight-regular-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-heading-text-font-weight-light:var(--spectrum-global-font-weight-light);--spectrum-alias-heading-text-font-weight-light-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-heading-text-font-weight-heavy:var(--spectrum-global-font-weight-black);--spectrum-alias-heading-text-font-weight-heavy-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-heading-text-font-weight-quiet:var(--spectrum-global-font-weight-light);--spectrum-alias-heading-text-font-weight-quiet-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-heading-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-heading-text-font-weight-strong-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-heading-margin-bottom:var(--spectrum-global-font-multiplier-25);--spectrum-alias-subheading-text-font-weight:var(--spectrum-global-font-weight-bold);--spectrum-alias-subheading-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-body-text-font-family:var(--spectrum-global-font-family-base);--spectrum-alias-body-text-line-height:var(--spectrum-global-font-line-height-medium);--spectrum-alias-body-text-font-weight:var(--spectrum-global-font-weight-regular);--spectrum-alias-body-text-font-weight-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-body-margin-bottom:var(--spectrum-global-font-multiplier-75);--spectrum-alias-detail-text-font-weight:var(--spectrum-global-font-weight-bold);--spectrum-alias-detail-text-font-weight-regular:var(--spectrum-global-font-weight-bold);--spectrum-alias-detail-text-font-weight-light:var(--spectrum-global-font-weight-regular);--spectrum-alias-detail-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-article-heading-text-font-weight:var(--spectrum-global-font-weight-bold);--spectrum-alias-article-heading-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-article-heading-text-font-weight-quiet:var(--spectrum-global-font-weight-regular);--spectrum-alias-article-heading-text-font-weight-quiet-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-article-body-text-font-weight:var(--spectrum-global-font-weight-regular);--spectrum-alias-article-body-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-article-subheading-text-font-weight:var(--spectrum-global-font-weight-bold);--spectrum-alias-article-subheading-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-article-detail-text-font-weight:var(--spectrum-global-font-weight-regular);--spectrum-alias-article-detail-text-font-weight-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-code-text-font-family:var(--spectrum-global-font-family-code);--spectrum-alias-code-text-font-weight-regular:var(--spectrum-global-font-weight-regular);--spectrum-alias-code-text-font-weight-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-code-text-line-height:var(--spectrum-global-font-line-height-medium);--spectrum-alias-code-margin-bottom:var(--spectrum-global-font-multiplier-0);--spectrum-alias-font-family-ar:var(--spectrum-global-font-font-family-ar);--spectrum-alias-font-family-he:var(--spectrum-global-font-font-family-he);--spectrum-alias-font-family-zh:var(--spectrum-global-font-font-family-zh);--spectrum-alias-font-family-zhhans:var(--spectrum-global-font-font-family-zhhans);--spectrum-alias-font-family-ko:var(--spectrum-global-font-font-family-ko);--spectrum-alias-font-family-ja:var(--spectrum-global-font-font-family-ja);--spectrum-alias-font-family-condensed:var(--spectrum-global-font-font-family-condensed);--spectrum-alias-component-text-line-height:var(--spectrum-global-font-line-height-small);--spectrum-alias-han-component-text-line-height:var(--spectrum-global-font-line-height-medium);--spectrum-alias-serif-text-font-family:var(--spectrum-global-font-family-serif);--spectrum-alias-han-heading-text-line-height:var(--spectrum-global-font-line-height-medium);--spectrum-alias-han-heading-text-font-weight-regular:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-heading-text-font-weight-regular-emphasis:var(--spectrum-global-font-weight-extra-bold);--spectrum-alias-han-heading-text-font-weight-regular-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-han-heading-text-font-weight-quiet-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-heading-text-font-weight-light:var(--spectrum-global-font-weight-light);--spectrum-alias-han-heading-text-font-weight-light-emphasis:var(--spectrum-global-font-weight-regular);--spectrum-alias-han-heading-text-font-weight-light-strong:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-heading-text-font-weight-heavy:var(--spectrum-global-font-weight-black);--spectrum-alias-han-heading-text-font-weight-heavy-emphasis:var(--spectrum-global-font-weight-black);--spectrum-alias-han-heading-text-font-weight-heavy-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-han-body-text-line-height:var(--spectrum-global-font-line-height-large);--spectrum-alias-han-body-text-font-weight-regular:var(--spectrum-global-font-weight-regular);--spectrum-alias-han-body-text-font-weight-emphasis:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-body-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-han-subheading-text-font-weight-regular:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-subheading-text-font-weight-emphasis:var(--spectrum-global-font-weight-extra-bold);--spectrum-alias-han-subheading-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-han-detail-text-font-weight:var(--spectrum-global-font-weight-regular);--spectrum-alias-han-detail-text-font-weight-emphasis:var(--spectrum-global-font-weight-bold);--spectrum-alias-han-detail-text-font-weight-strong:var(--spectrum-global-font-weight-black);--spectrum-alias-item-height-s:var(--spectrum-global-dimension-size-300);--spectrum-alias-item-height-m:var(--spectrum-global-dimension-size-400);--spectrum-alias-item-height-l:var(--spectrum-global-dimension-size-500);--spectrum-alias-item-height-xl:var(--spectrum-global-dimension-size-600);--spectrum-alias-item-rounded-border-radius-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-rounded-border-radius-m:var(--spectrum-global-dimension-size-200);--spectrum-alias-item-rounded-border-radius-l:var(--spectrum-global-dimension-size-250);--spectrum-alias-item-rounded-border-radius-xl:var(--spectrum-global-dimension-size-300);--spectrum-alias-item-text-size-s:var(--spectrum-global-dimension-font-size-75);--spectrum-alias-item-text-size-m:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-item-text-size-l:var(--spectrum-global-dimension-font-size-200);--spectrum-alias-item-text-size-xl:var(--spectrum-global-dimension-font-size-300);--spectrum-alias-item-text-padding-top-s:var(--spectrum-global-dimension-static-size-50);--spectrum-alias-item-text-padding-top-m:var(--spectrum-global-dimension-size-75);--spectrum-alias-item-text-padding-top-xl:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-text-padding-bottom-m:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-text-padding-bottom-l:var(--spectrum-global-dimension-size-130);--spectrum-alias-item-text-padding-bottom-xl:var(--spectrum-global-dimension-size-175);--spectrum-alias-item-icon-padding-top-s:var(--spectrum-global-dimension-size-50);--spectrum-alias-item-icon-padding-top-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-icon-padding-top-l:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-icon-padding-top-xl:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-icon-padding-bottom-s:var(--spectrum-global-dimension-size-50);--spectrum-alias-item-icon-padding-bottom-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-icon-padding-bottom-l:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-icon-padding-bottom-xl:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-padding-s:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-padding-m:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-padding-l:var(--spectrum-global-dimension-size-185);--spectrum-alias-item-padding-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-item-rounded-padding-s:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-rounded-padding-m:var(--spectrum-global-dimension-size-200);--spectrum-alias-item-rounded-padding-l:var(--spectrum-global-dimension-size-250);--spectrum-alias-item-rounded-padding-xl:var(--spectrum-global-dimension-size-300);--spectrum-alias-item-icononly-padding-s:var(--spectrum-global-dimension-size-50);--spectrum-alias-item-icononly-padding-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-icononly-padding-l:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-icononly-padding-xl:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-control-gap-s:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-control-gap-m:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-control-gap-l:var(--spectrum-global-dimension-size-130);--spectrum-alias-item-control-gap-xl:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-workflow-icon-gap-s:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-workflow-icon-gap-m:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-workflow-icon-gap-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-workflow-icon-gap-xl:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-mark-gap-s:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-mark-gap-m:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-mark-gap-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-mark-gap-xl:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-ui-icon-gap-s:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-ui-icon-gap-m:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-ui-icon-gap-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-ui-icon-gap-xl:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-clearbutton-gap-s:var(--spectrum-global-dimension-size-50);--spectrum-alias-item-clearbutton-gap-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-clearbutton-gap-l:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-clearbutton-gap-xl:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-workflow-padding-left-s:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-workflow-padding-left-l:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-workflow-padding-left-xl:var(--spectrum-global-dimension-size-185);--spectrum-alias-item-rounded-workflow-padding-left-s:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-rounded-workflow-padding-left-l:var(--spectrum-global-dimension-size-225);--spectrum-alias-item-mark-padding-top-s:var(--spectrum-global-dimension-size-40);--spectrum-alias-item-mark-padding-top-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-mark-padding-top-xl:var(--spectrum-global-dimension-size-130);--spectrum-alias-item-mark-padding-bottom-s:var(--spectrum-global-dimension-size-40);--spectrum-alias-item-mark-padding-bottom-l:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-mark-padding-bottom-xl:var(--spectrum-global-dimension-size-130);--spectrum-alias-item-mark-padding-left-s:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-mark-padding-left-l:var(--spectrum-global-dimension-size-160);--spectrum-alias-item-mark-padding-left-xl:var(--spectrum-global-dimension-size-185);--spectrum-alias-item-control-1-size-s:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-item-control-1-size-m:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-control-2-size-m:var(--spectrum-global-dimension-size-175);--spectrum-alias-item-control-2-size-l:var(--spectrum-global-dimension-size-200);--spectrum-alias-item-control-2-size-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-item-control-2-size-xxl:var(--spectrum-global-dimension-size-250);--spectrum-alias-item-control-2-border-radius-s:var(--spectrum-global-dimension-size-75);--spectrum-alias-item-control-2-border-radius-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-control-2-border-radius-l:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-control-2-border-radius-xl:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-control-2-border-radius-xxl:var(--spectrum-global-dimension-size-125);--spectrum-alias-item-control-2-padding-s:var(--spectrum-global-dimension-size-75);--spectrum-alias-item-control-2-padding-m:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-control-2-padding-l:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-control-2-padding-xl:var(--spectrum-global-dimension-size-185);--spectrum-alias-item-control-3-height-m:var(--spectrum-global-dimension-size-175);--spectrum-alias-item-control-3-height-l:var(--spectrum-global-dimension-size-200);--spectrum-alias-item-control-3-height-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-item-control-3-border-radius-s:var(--spectrum-global-dimension-size-75);--spectrum-alias-item-control-3-border-radius-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-item-control-3-border-radius-l:var(--spectrum-global-dimension-size-100);--spectrum-alias-item-control-3-border-radius-xl:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-control-3-padding-s:var(--spectrum-global-dimension-size-75);--spectrum-alias-item-control-3-padding-m:var(--spectrum-global-dimension-size-115);--spectrum-alias-item-control-3-padding-l:var(--spectrum-global-dimension-size-150);--spectrum-alias-item-control-3-padding-xl:var(--spectrum-global-dimension-size-185);--spectrum-alias-item-mark-size-s:var(--spectrum-global-dimension-size-225);--spectrum-alias-item-mark-size-l:var(--spectrum-global-dimension-size-275);--spectrum-alias-item-mark-size-xl:var(--spectrum-global-dimension-size-325);--spectrum-alias-heading-xxxl-text-size:var(--spectrum-global-dimension-font-size-1300);--spectrum-alias-heading-xxl-text-size:var(--spectrum-global-dimension-font-size-1100);--spectrum-alias-heading-xl-text-size:var(--spectrum-global-dimension-font-size-900);--spectrum-alias-heading-l-text-size:var(--spectrum-global-dimension-font-size-700);--spectrum-alias-heading-m-text-size:var(--spectrum-global-dimension-font-size-500);--spectrum-alias-heading-s-text-size:var(--spectrum-global-dimension-font-size-300);--spectrum-alias-heading-xs-text-size:var(--spectrum-global-dimension-font-size-200);--spectrum-alias-heading-xxs-text-size:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-heading-xxxl-margin-top:var(--spectrum-global-dimension-font-size-1200);--spectrum-alias-heading-xxl-margin-top:var(--spectrum-global-dimension-font-size-900);--spectrum-alias-heading-xl-margin-top:var(--spectrum-global-dimension-font-size-800);--spectrum-alias-heading-l-margin-top:var(--spectrum-global-dimension-font-size-600);--spectrum-alias-heading-m-margin-top:var(--spectrum-global-dimension-font-size-400);--spectrum-alias-heading-s-margin-top:var(--spectrum-global-dimension-font-size-200);--spectrum-alias-heading-xs-margin-top:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-heading-xxs-margin-top:var(--spectrum-global-dimension-font-size-75);--spectrum-alias-heading-han-xxxl-text-size:var(--spectrum-global-dimension-font-size-1300);--spectrum-alias-heading-han-xxl-text-size:var(--spectrum-global-dimension-font-size-900);--spectrum-alias-heading-han-xl-text-size:var(--spectrum-global-dimension-font-size-800);--spectrum-alias-heading-han-l-text-size:var(--spectrum-global-dimension-font-size-600);--spectrum-alias-heading-han-m-text-size:var(--spectrum-global-dimension-font-size-400);--spectrum-alias-heading-han-s-text-size:var(--spectrum-global-dimension-font-size-300);--spectrum-alias-heading-han-xs-text-size:var(--spectrum-global-dimension-font-size-200);--spectrum-alias-heading-han-xxs-text-size:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-heading-han-xxxl-margin-top:var(--spectrum-global-dimension-font-size-1200);--spectrum-alias-heading-han-xxl-margin-top:var(--spectrum-global-dimension-font-size-800);--spectrum-alias-heading-han-xl-margin-top:var(--spectrum-global-dimension-font-size-700);--spectrum-alias-heading-han-l-margin-top:var(--spectrum-global-dimension-font-size-500);--spectrum-alias-heading-han-m-margin-top:var(--spectrum-global-dimension-font-size-300);--spectrum-alias-heading-han-s-margin-top:var(--spectrum-global-dimension-font-size-200);--spectrum-alias-heading-han-xs-margin-top:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-heading-han-xxs-margin-top:var(--spectrum-global-dimension-font-size-75);--spectrum-alias-component-border-radius:var(--spectrum-global-dimension-size-50);--spectrum-alias-component-border-radius-quiet:var(--spectrum-global-dimension-static-size-0);--spectrum-alias-component-focusring-gap:var(--spectrum-global-dimension-static-size-0);--spectrum-alias-component-focusring-gap-emphasized:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-component-focusring-size:var(--spectrum-global-dimension-static-size-10);--spectrum-alias-component-focusring-size-emphasized:var(--spectrum-global-dimension-static-size-25);--spectrum-alias-input-border-size:var(--spectrum-global-dimension-static-size-10);--spectrum-alias-input-focusring-gap:var(--spectrum-global-dimension-static-size-0);--spectrum-alias-input-quiet-focusline-gap:var(--spectrum-global-dimension-static-size-10);--spectrum-alias-control-two-size-m:var(--spectrum-global-dimension-size-175);--spectrum-alias-control-two-size-l:var(--spectrum-global-dimension-size-200);--spectrum-alias-control-two-size-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-control-two-size-xxl:var(--spectrum-global-dimension-size-250);--spectrum-alias-control-two-border-radius-s:var(--spectrum-global-dimension-size-75);--spectrum-alias-control-two-border-radius-m:var(--spectrum-global-dimension-size-85);--spectrum-alias-control-two-border-radius-l:var(--spectrum-global-dimension-size-100);--spectrum-alias-control-two-border-radius-xl:var(--spectrum-global-dimension-size-115);--spectrum-alias-control-two-border-radius-xxl:var(--spectrum-global-dimension-size-125);--spectrum-alias-control-two-focus-ring-border-radius-s:var(--spectrum-global-dimension-size-125);--spectrum-alias-control-two-focus-ring-border-radius-m:var(--spectrum-global-dimension-size-130);--spectrum-alias-control-two-focus-ring-border-radius-l:var(--spectrum-global-dimension-size-150);--spectrum-alias-control-two-focus-ring-border-radius-xl:var(--spectrum-global-dimension-size-160);--spectrum-alias-control-two-focus-ring-border-radius-xxl:var(--spectrum-global-dimension-size-175);--spectrum-alias-control-three-height-m:var(--spectrum-global-dimension-size-175);--spectrum-alias-control-three-height-l:var(--spectrum-global-dimension-size-200);--spectrum-alias-control-three-height-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-clearbutton-icon-margin-s:var(--spectrum-global-dimension-size-100);--spectrum-alias-clearbutton-icon-margin-m:var(--spectrum-global-dimension-size-150);--spectrum-alias-clearbutton-icon-margin-l:var(--spectrum-global-dimension-size-185);--spectrum-alias-clearbutton-icon-margin-xl:var(--spectrum-global-dimension-size-225);--spectrum-alias-clearbutton-border-radius:var(--spectrum-global-dimension-size-50);--spectrum-alias-percent-50:50%;--spectrum-alias-percent-70:70%;--spectrum-alias-percent-100:100%;--spectrum-alias-breakpoint-xsmall:304px;--spectrum-alias-breakpoint-small:768px;--spectrum-alias-breakpoint-medium:1280px;--spectrum-alias-breakpoint-large:1768px;--spectrum-alias-breakpoint-xlarge:2160px;--spectrum-alias-grid-columns:12;--spectrum-alias-grid-fluid-width:100%;--spectrum-alias-grid-fixed-max-width:1280px;--spectrum-alias-focus-ring-gap-small:var(--spectrum-global-dimension-static-size-0);--spectrum-alias-focus-ring-size-small:var(--spectrum-global-dimension-static-size-10);--spectrum-alias-dropshadow-blur:var(--spectrum-global-dimension-size-50);--spectrum-alias-dropshadow-offset-y:var(--spectrum-global-dimension-size-10);--spectrum-alias-font-size-default:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-layout-label-gap-size:var(--spectrum-global-dimension-size-100);--spectrum-alias-pill-button-text-size:var(--spectrum-global-dimension-font-size-100);--spectrum-alias-pill-button-text-baseline:var(--spectrum-global-dimension-static-size-150);--spectrum-alias-border-radius-xsmall:var(--spectrum-global-dimension-size-10);--spectrum-alias-border-radius-small:var(--spectrum-global-dimension-size-25);--spectrum-alias-border-radius-regular:var(--spectrum-global-dimension-size-50);--spectrum-alias-border-radius-medium:var(--spectrum-global-dimension-size-100);--spectrum-alias-border-radius-large:var(--spectrum-global-dimension-size-200);--spectrum-alias-border-radius-xlarge:var(--spectrum-global-dimension-size-300);--spectrum-alias-focus-ring-border-radius-xsmall:var(--spectrum-global-dimension-size-50);--spectrum-alias-focus-ring-border-radius-small:var(--spectrum-global-dimension-static-size-65);--spectrum-alias-focus-ring-border-radius-medium:var(--spectrum-global-dimension-size-150);--spectrum-alias-focus-ring-border-radius-large:var(--spectrum-global-dimension-size-250);--spectrum-alias-focus-ring-border-radius-xlarge:var(--spectrum-global-dimension-size-350);--spectrum-alias-single-line-height:var(--spectrum-global-dimension-size-400);--spectrum-alias-single-line-width:var(--spectrum-global-dimension-size-2400);--spectrum-alias-workflow-icon-size-s:var(--spectrum-global-dimension-size-200);--spectrum-alias-workflow-icon-size-m:var(--spectrum-global-dimension-size-225);--spectrum-alias-workflow-icon-size-xl:var(--spectrum-global-dimension-size-275);--spectrum-alias-ui-icon-alert-size-75:var(--spectrum-global-dimension-size-200);--spectrum-alias-ui-icon-alert-size-100:var(--spectrum-global-dimension-size-225);--spectrum-alias-ui-icon-alert-size-200:var(--spectrum-global-dimension-size-250);--spectrum-alias-ui-icon-alert-size-300:var(--spectrum-global-dimension-size-275);--spectrum-alias-ui-icon-triplegripper-size-100-height:var(--spectrum-global-dimension-size-100);--spectrum-alias-ui-icon-doublegripper-size-100-width:var(--spectrum-global-dimension-size-200);--spectrum-alias-ui-icon-singlegripper-size-100-width:var(--spectrum-global-dimension-size-300);--spectrum-alias-ui-icon-cornertriangle-size-75:var(--spectrum-global-dimension-size-65);--spectrum-alias-ui-icon-cornertriangle-size-200:var(--spectrum-global-dimension-size-75);--spectrum-alias-ui-icon-asterisk-size-75:var(--spectrum-global-dimension-static-size-100);--spectrum-alias-ui-icon-asterisk-size-100:var(--spectrum-global-dimension-size-100);--spectrum-alias-transparent-blue-background-color-hover:#0057be26;--spectrum-alias-transparent-blue-background-color-down:#0048994d;--spectrum-alias-transparent-blue-background-color-key-focus:var(--spectrum-alias-transparent-blue-background-color-hover);--spectrum-alias-transparent-blue-background-color-mouse-focus:var(--spectrum-alias-transparent-blue-background-color-hover);--spectrum-alias-transparent-blue-background-color:var(--spectrum-alias-component-text-color-default);--spectrum-alias-transparent-red-background-color-hover:#9a000026;--spectrum-alias-transparent-red-background-color-down:#7c00004d;--spectrum-alias-transparent-red-background-color-key-focus:var(--spectrum-alias-transparent-red-background-color-hover);--spectrum-alias-transparent-red-background-color-mouse-focus:var(--spectrum-alias-transparent-red-background-color-hover);--spectrum-alias-transparent-red-background-color:var(--spectrum-alias-component-text-color-default);--spectrum-alias-component-text-color-disabled:var(--spectrum-global-color-gray-500);--spectrum-alias-component-text-color-default:var(--spectrum-global-color-gray-800);--spectrum-alias-component-text-color-hover:var(--spectrum-global-color-gray-900);--spectrum-alias-component-text-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-component-text-color-key-focus:var(--spectrum-alias-component-text-color-hover);--spectrum-alias-component-text-color-mouse-focus:var(--spectrum-alias-component-text-color-hover);--spectrum-alias-component-text-color:var(--spectrum-alias-component-text-color-default);--spectrum-alias-component-text-color-selected-default:var(--spectrum-alias-component-text-color-default);--spectrum-alias-component-text-color-selected-hover:var(--spectrum-alias-component-text-color-hover);--spectrum-alias-component-text-color-selected-down:var(--spectrum-alias-component-text-color-down);--spectrum-alias-component-text-color-selected-key-focus:var(--spectrum-alias-component-text-color-key-focus);--spectrum-alias-component-text-color-selected-mouse-focus:var(--spectrum-alias-component-text-color-mouse-focus);--spectrum-alias-component-text-color-selected:var(--spectrum-alias-component-text-color-selected-default);--spectrum-alias-component-text-color-emphasized-selected-default:var(--spectrum-global-color-static-white);--spectrum-alias-component-text-color-emphasized-selected-hover:var(--spectrum-alias-component-text-color-emphasized-selected-default);--spectrum-alias-component-text-color-emphasized-selected-down:var(--spectrum-alias-component-text-color-emphasized-selected-default);--spectrum-alias-component-text-color-emphasized-selected-key-focus:var(--spectrum-alias-component-text-color-emphasized-selected-default);--spectrum-alias-component-text-color-emphasized-selected-mouse-focus:var(--spectrum-alias-component-text-color-emphasized-selected-default);--spectrum-alias-component-text-color-emphasized-selected:var(--spectrum-alias-component-text-color-emphasized-selected-default);--spectrum-alias-component-text-color-error-default:var(--spectrum-semantic-negative-text-color-small);--spectrum-alias-component-text-color-error-hover:var(--spectrum-semantic-negative-text-color-small-hover);--spectrum-alias-component-text-color-error-down:var(--spectrum-semantic-negative-text-color-small-down);--spectrum-alias-component-text-color-error-key-focus:var(--spectrum-semantic-negative-text-color-small-key-focus);--spectrum-alias-component-text-color-error-mouse-focus:var(--spectrum-semantic-negative-text-color-small-key-focus);--spectrum-alias-component-text-color-error:var(--spectrum-alias-component-text-color-error-default);--spectrum-alias-component-icon-color-disabled:var(--spectrum-alias-icon-color-disabled);--spectrum-alias-component-icon-color-default:var(--spectrum-alias-icon-color);--spectrum-alias-component-icon-color-hover:var(--spectrum-alias-icon-color-hover);--spectrum-alias-component-icon-color-down:var(--spectrum-alias-icon-color-down);--spectrum-alias-component-icon-color-key-focus:var(--spectrum-alias-icon-color-hover);--spectrum-alias-component-icon-color-mouse-focus:var(--spectrum-alias-icon-color-down);--spectrum-alias-component-icon-color:var(--spectrum-alias-component-icon-color-default);--spectrum-alias-component-icon-color-selected:var(--spectrum-alias-icon-color-selected-neutral-subdued);--spectrum-alias-component-icon-color-emphasized-selected-default:var(--spectrum-global-color-static-white);--spectrum-alias-component-icon-color-emphasized-selected-hover:var(--spectrum-alias-component-icon-color-emphasized-selected-default);--spectrum-alias-component-icon-color-emphasized-selected-down:var(--spectrum-alias-component-icon-color-emphasized-selected-default);--spectrum-alias-component-icon-color-emphasized-selected-key-focus:var(--spectrum-alias-component-icon-color-emphasized-selected-default);--spectrum-alias-component-icon-color-emphasized-selected:var(--spectrum-alias-component-icon-color-emphasized-selected-default);--spectrum-alias-component-background-color-disabled:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-quiet-disabled:var(--spectrum-alias-background-color-transparent);--spectrum-alias-component-background-color-quiet-selected-disabled:var(--spectrum-alias-component-background-color-disabled);--spectrum-alias-component-background-color-default:var(--spectrum-global-color-gray-75);--spectrum-alias-component-background-color-hover:var(--spectrum-global-color-gray-50);--spectrum-alias-component-background-color-down:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-key-focus:var(--spectrum-global-color-gray-50);--spectrum-alias-component-background-color:var(--spectrum-alias-component-background-color-default);--spectrum-alias-component-background-color-selected-default:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-selected-hover:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-selected-down:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-selected-key-focus:var(--spectrum-global-color-gray-200);--spectrum-alias-component-background-color-selected:var(--spectrum-alias-component-background-color-selected-default);--spectrum-alias-component-background-color-quiet-default:var(--spectrum-alias-background-color-transparent);--spectrum-alias-component-background-color-quiet-hover:var(--spectrum-alias-background-color-transparent);--spectrum-alias-component-background-color-quiet-down:var(--spectrum-global-color-gray-300);--spectrum-alias-component-background-color-quiet-key-focus:var(--spectrum-alias-background-color-transparent);--spectrum-alias-component-background-color-quiet:var(--spectrum-alias-component-background-color-quiet-default);--spectrum-alias-component-background-color-quiet-selected-default:var(--spectrum-alias-component-background-color-selected-default);--spectrum-alias-component-background-color-quiet-selected-hover:var(--spectrum-alias-component-background-color-selected-hover);--spectrum-alias-component-background-color-quiet-selected-down:var(--spectrum-alias-component-background-color-selected-down);--spectrum-alias-component-background-color-quiet-selected-key-focus:var(--spectrum-alias-component-background-color-selected-key-focus);--spectrum-alias-component-background-color-quiet-selected:var(--spectrum-alias-component-background-color-selected-default);--spectrum-alias-component-background-color-emphasized-selected-default:var(--spectrum-semantic-cta-background-color-default);--spectrum-alias-component-background-color-emphasized-selected-hover:var(--spectrum-semantic-cta-background-color-hover);--spectrum-alias-component-background-color-emphasized-selected-down:var(--spectrum-semantic-cta-background-color-down);--spectrum-alias-component-background-color-emphasized-selected-key-focus:var(--spectrum-semantic-cta-background-color-key-focus);--spectrum-alias-component-background-color-emphasized-selected:var(--spectrum-alias-component-background-color-emphasized-selected-default);--spectrum-alias-component-border-color-disabled:var(--spectrum-alias-border-color-disabled);--spectrum-alias-component-border-color-quiet-disabled:var(--spectrum-alias-border-color-transparent);--spectrum-alias-component-border-color-default:var(--spectrum-alias-border-color);--spectrum-alias-component-border-color-hover:var(--spectrum-alias-border-color-hover);--spectrum-alias-component-border-color-down:var(--spectrum-alias-border-color-down);--spectrum-alias-component-border-color-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-component-border-color:var(--spectrum-alias-component-border-color-default);--spectrum-alias-component-border-color-selected-default:var(--spectrum-alias-border-color);--spectrum-alias-component-border-color-selected-hover:var(--spectrum-alias-border-color-hover);--spectrum-alias-component-border-color-selected-down:var(--spectrum-alias-border-color-down);--spectrum-alias-component-border-color-selected-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-component-border-color-selected:var(--spectrum-alias-component-border-color-selected-default);--spectrum-alias-component-border-color-quiet-default:var(--spectrum-alias-border-color-transparent);--spectrum-alias-component-border-color-quiet-hover:var(--spectrum-alias-border-color-transparent);--spectrum-alias-component-border-color-quiet-down:var(--spectrum-alias-border-color-transparent);--spectrum-alias-component-border-color-quiet-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-component-border-color-quiet:var(--spectrum-alias-component-border-color-quiet-default);--spectrum-alias-component-border-color-quiet-selected-default:var(--spectrum-global-color-gray-200);--spectrum-alias-component-border-color-quiet-selected-hover:var(--spectrum-global-color-gray-200);--spectrum-alias-component-border-color-quiet-selected-down:var(--spectrum-global-color-gray-200);--spectrum-alias-component-border-color-quiet-selected-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-component-border-color-quiet-selected:var(--spectrum-alias-component-border-color-quiet-selected-default);--spectrum-alias-component-border-color-emphasized-selected-default:var(--spectrum-semantic-cta-background-color-default);--spectrum-alias-component-border-color-emphasized-selected-hover:var(--spectrum-semantic-cta-background-color-hover);--spectrum-alias-component-border-color-emphasized-selected-down:var(--spectrum-semantic-cta-background-color-down);--spectrum-alias-component-border-color-emphasized-selected-key-focus:var(--spectrum-semantic-cta-background-color-key-focus);--spectrum-alias-component-border-color-emphasized-selected:var(--spectrum-alias-component-border-color-emphasized-selected-default);--spectrum-alias-toggle-background-color-default:var(--spectrum-global-color-gray-700);--spectrum-alias-toggle-background-color-hover:var(--spectrum-global-color-gray-800);--spectrum-alias-toggle-background-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-toggle-background-color-key-focus:var(--spectrum-global-color-gray-800);--spectrum-alias-toggle-background-color:var(--spectrum-alias-toggle-background-color-default);--spectrum-alias-toggle-background-color-emphasized-selected-default:var(--spectrum-global-color-blue-500);--spectrum-alias-toggle-background-color-emphasized-selected-hover:var(--spectrum-global-color-blue-600);--spectrum-alias-toggle-background-color-emphasized-selected-down:var(--spectrum-global-color-blue-700);--spectrum-alias-toggle-background-color-emphasized-selected-key-focus:var(--spectrum-global-color-blue-600);--spectrum-alias-toggle-background-color-emphasized-selected:var(--spectrum-alias-toggle-background-color-emphasized-selected-default);--spectrum-alias-toggle-border-color-default:var(--spectrum-global-color-gray-700);--spectrum-alias-toggle-border-color-hover:var(--spectrum-global-color-gray-800);--spectrum-alias-toggle-border-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-toggle-border-color-key-focus:var(--spectrum-global-color-gray-800);--spectrum-alias-toggle-border-color:var(--spectrum-alias-toggle-border-color-default);--spectrum-alias-toggle-icon-color-selected:var(--spectrum-global-color-gray-75);--spectrum-alias-toggle-icon-color-emphasized-selected:var(--spectrum-global-color-gray-75);--spectrum-alias-input-border-color-disabled:var(--spectrum-alias-border-color-transparent);--spectrum-alias-input-border-color-quiet-disabled:var(--spectrum-alias-border-color-mid);--spectrum-alias-input-border-color-default:var(--spectrum-alias-border-color);--spectrum-alias-input-border-color-hover:var(--spectrum-alias-border-color-hover);--spectrum-alias-input-border-color-down:var(--spectrum-alias-border-color-mouse-focus);--spectrum-alias-input-border-color-mouse-focus:var(--spectrum-alias-border-color-mouse-focus);--spectrum-alias-input-border-color-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-input-border-color:var(--spectrum-alias-input-border-color-default);--spectrum-alias-input-border-color-invalid-default:var(--spectrum-semantic-negative-color-default);--spectrum-alias-input-border-color-invalid-hover:var(--spectrum-semantic-negative-color-hover);--spectrum-alias-input-border-color-invalid-down:var(--spectrum-semantic-negative-color-down);--spectrum-alias-input-border-color-invalid-mouse-focus:var(--spectrum-semantic-negative-color-hover);--spectrum-alias-input-border-color-invalid-key-focus:var(--spectrum-alias-border-color-key-focus);--spectrum-alias-input-border-color-invalid:var(--spectrum-alias-input-border-color-invalid-default);--spectrum-alias-background-color-yellow-default:var(--spectrum-global-color-static-yellow-300);--spectrum-alias-background-color-yellow-hover:var(--spectrum-global-color-static-yellow-400);--spectrum-alias-background-color-yellow-key-focus:var(--spectrum-global-color-static-yellow-400);--spectrum-alias-background-color-yellow-down:var(--spectrum-global-color-static-yellow-500);--spectrum-alias-background-color-yellow:var(--spectrum-alias-background-color-yellow-default);--spectrum-alias-tabitem-text-color-default:var(--spectrum-alias-label-text-color);--spectrum-alias-tabitem-text-color-hover:var(--spectrum-alias-text-color-hover);--spectrum-alias-tabitem-text-color-down:var(--spectrum-alias-text-color-down);--spectrum-alias-tabitem-text-color-key-focus:var(--spectrum-alias-text-color-hover);--spectrum-alias-tabitem-text-color-mouse-focus:var(--spectrum-alias-text-color-hover);--spectrum-alias-tabitem-text-color:var(--spectrum-alias-tabitem-text-color-default);--spectrum-alias-tabitem-text-color-selected-default:var(--spectrum-global-color-gray-900);--spectrum-alias-tabitem-text-color-selected-hover:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-text-color-selected-down:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-text-color-selected-key-focus:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-text-color-selected-mouse-focus:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-text-color-selected:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-text-color-emphasized:var(--spectrum-alias-tabitem-text-color-default);--spectrum-alias-tabitem-text-color-emphasized-selected-default:var(--spectrum-global-color-static-blue-500);--spectrum-alias-tabitem-text-color-emphasized-selected-hover:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-text-color-emphasized-selected-down:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-text-color-emphasized-selected-key-focus:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-text-color-emphasized-selected-mouse-focus:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-text-color-emphasized-selected:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-selection-indicator-color-default:var(--spectrum-alias-tabitem-text-color-selected-default);--spectrum-alias-tabitem-selection-indicator-color-emphasized:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-tabitem-icon-color-disabled:var(--spectrum-alias-text-color-disabled);--spectrum-alias-tabitem-icon-color-default:var(--spectrum-alias-icon-color);--spectrum-alias-tabitem-icon-color-hover:var(--spectrum-alias-icon-color-hover);--spectrum-alias-tabitem-icon-color-down:var(--spectrum-alias-icon-color-down);--spectrum-alias-tabitem-icon-color-key-focus:var(--spectrum-alias-icon-color-hover);--spectrum-alias-tabitem-icon-color-mouse-focus:var(--spectrum-alias-icon-color-down);--spectrum-alias-tabitem-icon-color:var(--spectrum-alias-tabitem-icon-color-default);--spectrum-alias-tabitem-icon-color-selected:var(--spectrum-alias-icon-color-selected-neutral);--spectrum-alias-tabitem-icon-color-emphasized:var(--spectrum-alias-tabitem-text-color-default);--spectrum-alias-tabitem-icon-color-emphasized-selected:var(--spectrum-alias-tabitem-text-color-emphasized-selected-default);--spectrum-alias-assetcard-selectionindicator-background-color-ordered:var(--spectrum-global-color-blue-500);--spectrum-alias-assetcard-overlay-background-color:#1b7ff51a;--spectrum-alias-assetcard-border-color-selected:var(--spectrum-global-color-blue-500);--spectrum-alias-assetcard-border-color-selected-hover:var(--spectrum-global-color-blue-500);--spectrum-alias-assetcard-border-color-selected-down:var(--spectrum-global-color-blue-600);--spectrum-alias-background-color-default:var(--spectrum-global-color-gray-100);--spectrum-alias-background-color-disabled:var(--spectrum-global-color-gray-200);--spectrum-alias-background-color-transparent:transparent;--spectrum-alias-background-color-overbackground-down:#fff3;--spectrum-alias-background-color-quiet-overbackground-hover:#ffffff1a;--spectrum-alias-background-color-quiet-overbackground-down:#fff3;--spectrum-alias-background-color-overbackground-disabled:#ffffff1a;--spectrum-alias-background-color-quickactions-overlay:#0003;--spectrum-alias-placeholder-text-color:var(--spectrum-global-color-gray-800);--spectrum-alias-placeholder-text-color-hover:var(--spectrum-global-color-gray-900);--spectrum-alias-placeholder-text-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-placeholder-text-color-selected:var(--spectrum-global-color-gray-800);--spectrum-alias-label-text-color:var(--spectrum-global-color-gray-700);--spectrum-alias-text-color:var(--spectrum-global-color-gray-800);--spectrum-alias-text-color-hover:var(--spectrum-global-color-gray-900);--spectrum-alias-text-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-text-color-key-focus:var(--spectrum-global-color-blue-600);--spectrum-alias-text-color-mouse-focus:var(--spectrum-global-color-blue-600);--spectrum-alias-text-color-disabled:var(--spectrum-global-color-gray-500);--spectrum-alias-text-color-invalid:var(--spectrum-global-color-red-500);--spectrum-alias-text-color-selected:var(--spectrum-global-color-blue-600);--spectrum-alias-text-color-selected-neutral:var(--spectrum-global-color-gray-900);--spectrum-alias-text-color-overbackground:var(--spectrum-global-color-static-white);--spectrum-alias-text-color-overbackground-disabled:#fff3;--spectrum-alias-text-color-quiet-overbackground-disabled:#fff3;--spectrum-alias-heading-text-color:var(--spectrum-global-color-gray-900);--spectrum-alias-border-color:var(--spectrum-global-color-gray-400);--spectrum-alias-border-color-hover:var(--spectrum-global-color-gray-500);--spectrum-alias-border-color-down:var(--spectrum-global-color-gray-500);--spectrum-alias-border-color-key-focus:var(--spectrum-global-color-blue-400);--spectrum-alias-border-color-mouse-focus:var(--spectrum-global-color-blue-500);--spectrum-alias-border-color-disabled:var(--spectrum-global-color-gray-200);--spectrum-alias-border-color-extralight:var(--spectrum-global-color-gray-100);--spectrum-alias-border-color-light:var(--spectrum-global-color-gray-200);--spectrum-alias-border-color-mid:var(--spectrum-global-color-gray-300);--spectrum-alias-border-color-dark:var(--spectrum-global-color-gray-400);--spectrum-alias-border-color-darker-default:var(--spectrum-global-color-gray-600);--spectrum-alias-border-color-darker-hover:var(--spectrum-global-color-gray-900);--spectrum-alias-border-color-darker-down:var(--spectrum-global-color-gray-900);--spectrum-alias-border-color-transparent:transparent;--spectrum-alias-border-color-translucent-dark:#0000000d;--spectrum-alias-border-color-translucent-darker:#0000001a;--spectrum-alias-focus-color:var(--spectrum-global-color-blue-400);--spectrum-alias-focus-ring-color:var(--spectrum-alias-focus-color);--spectrum-alias-track-color-default:var(--spectrum-global-color-gray-300);--spectrum-alias-track-fill-color-overbackground:var(--spectrum-global-color-static-white);--spectrum-alias-track-color-disabled:var(--spectrum-global-color-gray-300);--spectrum-alias-track-color-overbackground:#fff3;--spectrum-alias-icon-color:var(--spectrum-global-color-gray-700);--spectrum-alias-icon-color-overbackground:var(--spectrum-global-color-static-white);--spectrum-alias-icon-color-hover:var(--spectrum-global-color-gray-900);--spectrum-alias-icon-color-down:var(--spectrum-global-color-gray-900);--spectrum-alias-icon-color-key-focus:var(--spectrum-global-color-gray-900);--spectrum-alias-icon-color-disabled:var(--spectrum-global-color-gray-400);--spectrum-alias-icon-color-overbackground-disabled:#fff3;--spectrum-alias-icon-color-quiet-overbackground-disabled:#ffffff26;--spectrum-alias-icon-color-selected-neutral:var(--spectrum-global-color-gray-900);--spectrum-alias-icon-color-selected-neutral-subdued:var(--spectrum-global-color-gray-800);--spectrum-alias-icon-color-selected:var(--spectrum-global-color-blue-500);--spectrum-alias-icon-color-selected-hover:var(--spectrum-global-color-blue-600);--spectrum-alias-icon-color-selected-down:var(--spectrum-global-color-blue-700);--spectrum-alias-icon-color-selected-focus:var(--spectrum-global-color-blue-600);--spectrum-alias-image-opacity-disabled:var(--spectrum-global-color-opacity-30);--spectrum-alias-toolbar-background-color:var(--spectrum-global-color-gray-100);--spectrum-alias-code-highlight-color-default:var(--spectrum-global-color-gray-800);--spectrum-alias-code-highlight-background-color:var(--spectrum-global-color-gray-75);--spectrum-alias-code-highlight-color-keyword:var(--spectrum-global-color-fuchsia-600);--spectrum-alias-code-highlight-color-section:var(--spectrum-global-color-red-600);--spectrum-alias-code-highlight-color-literal:var(--spectrum-global-color-blue-600);--spectrum-alias-code-highlight-color-attribute:var(--spectrum-global-color-seafoam-600);--spectrum-alias-code-highlight-color-class:var(--spectrum-global-color-magenta-600);--spectrum-alias-code-highlight-color-variable:var(--spectrum-global-color-purple-600);--spectrum-alias-code-highlight-color-title:var(--spectrum-global-color-indigo-600);--spectrum-alias-code-highlight-color-string:var(--spectrum-global-color-fuchsia-600);--spectrum-alias-code-highlight-color-function:var(--spectrum-global-color-blue-600);--spectrum-alias-code-highlight-color-comment:var(--spectrum-global-color-gray-700);--spectrum-alias-categorical-color-1:var(--spectrum-global-color-static-seafoam-200);--spectrum-alias-categorical-color-2:var(--spectrum-global-color-static-indigo-700);--spectrum-alias-categorical-color-3:var(--spectrum-global-color-static-orange-500);--spectrum-alias-categorical-color-4:var(--spectrum-global-color-static-magenta-500);--spectrum-alias-categorical-color-5:var(--spectrum-global-color-static-indigo-200);--spectrum-alias-categorical-color-6:var(--spectrum-global-color-static-celery-200);--spectrum-alias-categorical-color-7:var(--spectrum-global-color-static-blue-500);--spectrum-alias-categorical-color-8:var(--spectrum-global-color-static-purple-800);--spectrum-alias-categorical-color-9:var(--spectrum-global-color-static-yellow-500);--spectrum-alias-categorical-color-10:var(--spectrum-global-color-static-orange-700);--spectrum-alias-categorical-color-11:var(--spectrum-global-color-static-green-600);--spectrum-alias-categorical-color-12:var(--spectrum-global-color-static-chartreuse-300);--spectrum-alias-categorical-color-13:var(--spectrum-global-color-static-blue-200);--spectrum-alias-categorical-color-14:var(--spectrum-global-color-static-fuchsia-500);--spectrum-alias-categorical-color-15:var(--spectrum-global-color-static-magenta-200);--spectrum-alias-categorical-color-16:var(--spectrum-global-color-static-yellow-200)}:host,:root{-webkit-tap-highlight-color:#0000;--spectrum-focus-indicator-color:var(--spectrum-blue-800);--spectrum-static-white-focus-indicator-color:var(--spectrum-white);--spectrum-static-black-focus-indicator-color:var(--spectrum-black);--spectrum-overlay-color:var(--spectrum-black);--spectrum-opacity-disabled:.3;--spectrum-neutral-subdued-content-color-selected:var(--spectrum-neutral-subdued-content-color-down);--spectrum-accent-content-color-selected:var(--spectrum-accent-content-color-down);--spectrum-disabled-background-color:var(--spectrum-gray-200);--spectrum-disabled-static-white-background-color:var(--spectrum-transparent-white-200);--spectrum-disabled-static-black-background-color:var(--spectrum-transparent-black-200);--spectrum-background-opacity-default:0;--spectrum-background-opacity-hover:.1;--spectrum-background-opacity-down:.1;--spectrum-background-opacity-key-focus:.1;--spectrum-neutral-content-color-default:var(--spectrum-gray-800);--spectrum-neutral-content-color-hover:var(--spectrum-gray-900);--spectrum-neutral-content-color-down:var(--spectrum-gray-900);--spectrum-neutral-content-color-focus-hover:var(--spectrum-neutral-content-color-down);--spectrum-neutral-content-color-focus:var(--spectrum-neutral-content-color-down);--spectrum-neutral-content-color-key-focus:var(--spectrum-gray-900);--spectrum-neutral-subdued-content-color-default:var(--spectrum-gray-700);--spectrum-neutral-subdued-content-color-hover:var(--spectrum-gray-800);--spectrum-neutral-subdued-content-color-down:var(--spectrum-gray-900);--spectrum-neutral-subdued-content-color-key-focus:var(--spectrum-gray-800);--spectrum-accent-content-color-default:var(--spectrum-accent-color-900);--spectrum-accent-content-color-hover:var(--spectrum-accent-color-1000);--spectrum-accent-content-color-down:var(--spectrum-accent-color-1100);--spectrum-accent-content-color-key-focus:var(--spectrum-accent-color-1000);--spectrum-negative-content-color-default:var(--spectrum-negative-color-900);--spectrum-negative-content-color-hover:var(--spectrum-negative-color-1000);--spectrum-negative-content-color-down:var(--spectrum-negative-color-1100);--spectrum-negative-content-color-key-focus:var(--spectrum-negative-color-1000);--spectrum-disabled-content-color:var(--spectrum-gray-400);--spectrum-disabled-static-white-content-color:var(--spectrum-transparent-white-500);--spectrum-disabled-static-black-content-color:var(--spectrum-transparent-black-500);--spectrum-disabled-border-color:var(--spectrum-gray-300);--spectrum-disabled-static-white-border-color:var(--spectrum-transparent-white-300);--spectrum-disabled-static-black-border-color:var(--spectrum-transparent-black-300);--spectrum-negative-border-color-default:var(--spectrum-negative-color-900);--spectrum-negative-border-color-hover:var(--spectrum-negative-color-1000);--spectrum-negative-border-color-down:var(--spectrum-negative-color-1100);--spectrum-negative-border-color-focus-hover:var(--spectrum-negative-border-color-down);--spectrum-negative-border-color-focus:var(--spectrum-negative-color-1000);--spectrum-negative-border-color-key-focus:var(--spectrum-negative-color-1000);--spectrum-swatch-border-color:var(--spectrum-gray-900);--spectrum-swatch-border-opacity:.51;--spectrum-swatch-disabled-icon-border-color:var(--spectrum-black);--spectrum-swatch-disabled-icon-border-opacity:.51;--spectrum-thumbnail-border-color:var(--spectrum-gray-800);--spectrum-thumbnail-border-opacity:.1;--spectrum-thumbnail-opacity-disabled:var(--spectrum-opacity-disabled);--spectrum-opacity-checkerboard-square-light:var(--spectrum-white);--spectrum-avatar-opacity-disabled:var(--spectrum-opacity-disabled);--spectrum-color-area-border-color:var(--spectrum-gray-900);--spectrum-color-area-border-opacity:.1;--spectrum-color-slider-border-color:var(--spectrum-gray-900);--spectrum-color-slider-border-opacity:.1;--spectrum-color-loupe-drop-shadow-color:var(--spectrum-transparent-black-300);--spectrum-color-loupe-inner-border:var(--spectrum-transparent-black-200);--spectrum-color-loupe-outer-border:var(--spectrum-white);--spectrum-card-selection-background-color:var(--spectrum-gray-100);--spectrum-card-selection-background-color-opacity:.95;--spectrum-drop-zone-background-color:var(--spectrum-accent-visual-color);--spectrum-drop-zone-background-color-opacity:.1;--spectrum-drop-zone-background-color-opacity-filled:.3;--spectrum-coach-mark-pagination-color:var(--spectrum-gray-600);--spectrum-color-handle-inner-border-color:var(--spectrum-black);--spectrum-color-handle-inner-border-opacity:.42;--spectrum-color-handle-outer-border-color:var(--spectrum-black);--spectrum-color-handle-outer-border-opacity:var(--spectrum-color-handle-inner-border-opacity);--spectrum-color-handle-drop-shadow-color:var(--spectrum-drop-shadow-color);--spectrum-floating-action-button-drop-shadow-color:var(--spectrum-transparent-black-300);--spectrum-floating-action-button-shadow-color:var(--spectrum-floating-action-button-drop-shadow-color);--spectrum-table-row-hover-color:var(--spectrum-gray-900);--spectrum-table-row-hover-opacity:.07;--spectrum-table-selected-row-background-color:var(--spectrum-informative-background-color-default);--spectrum-table-selected-row-background-opacity:.1;--spectrum-table-selected-row-background-color-non-emphasized:var(--spectrum-neutral-background-color-selected-default);--spectrum-table-selected-row-background-opacity-non-emphasized:.1;--spectrum-table-row-down-opacity:.1;--spectrum-table-selected-row-background-opacity-hover:.15;--spectrum-table-selected-row-background-opacity-non-emphasized-hover:.15;--spectrum-white-rgb:255,255,255;--spectrum-white:rgba(var(--spectrum-white-rgb));--spectrum-transparent-white-100-rgb:255,255,255;--spectrum-transparent-white-100-opacity:0;--spectrum-transparent-white-100:rgba(var(--spectrum-transparent-white-100-rgb),var(--spectrum-transparent-white-100-opacity));--spectrum-transparent-white-200-rgb:255,255,255;--spectrum-transparent-white-200-opacity:.1;--spectrum-transparent-white-200:rgba(var(--spectrum-transparent-white-200-rgb),var(--spectrum-transparent-white-200-opacity));--spectrum-transparent-white-300-rgb:255,255,255;--spectrum-transparent-white-300-opacity:.25;--spectrum-transparent-white-300:rgba(var(--spectrum-transparent-white-300-rgb),var(--spectrum-transparent-white-300-opacity));--spectrum-transparent-white-400-rgb:255,255,255;--spectrum-transparent-white-400-opacity:.4;--spectrum-transparent-white-400:rgba(var(--spectrum-transparent-white-400-rgb),var(--spectrum-transparent-white-400-opacity));--spectrum-transparent-white-500-rgb:255,255,255;--spectrum-transparent-white-500-opacity:.55;--spectrum-transparent-white-500:rgba(var(--spectrum-transparent-white-500-rgb),var(--spectrum-transparent-white-500-opacity));--spectrum-transparent-white-600-rgb:255,255,255;--spectrum-transparent-white-600-opacity:.7;--spectrum-transparent-white-600:rgba(var(--spectrum-transparent-white-600-rgb),var(--spectrum-transparent-white-600-opacity));--spectrum-transparent-white-700-rgb:255,255,255;--spectrum-transparent-white-700-opacity:.8;--spectrum-transparent-white-700:rgba(var(--spectrum-transparent-white-700-rgb),var(--spectrum-transparent-white-700-opacity));--spectrum-transparent-white-800-rgb:255,255,255;--spectrum-transparent-white-800-opacity:.9;--spectrum-transparent-white-800:rgba(var(--spectrum-transparent-white-800-rgb),var(--spectrum-transparent-white-800-opacity));--spectrum-transparent-white-900-rgb:255,255,255;--spectrum-transparent-white-900:rgba(var(--spectrum-transparent-white-900-rgb));--spectrum-black-rgb:0,0,0;--spectrum-black:rgba(var(--spectrum-black-rgb));--spectrum-transparent-black-100-rgb:0,0,0;--spectrum-transparent-black-100-opacity:0;--spectrum-transparent-black-100:rgba(var(--spectrum-transparent-black-100-rgb),var(--spectrum-transparent-black-100-opacity));--spectrum-transparent-black-200-rgb:0,0,0;--spectrum-transparent-black-200-opacity:.1;--spectrum-transparent-black-200:rgba(var(--spectrum-transparent-black-200-rgb),var(--spectrum-transparent-black-200-opacity));--spectrum-transparent-black-300-rgb:0,0,0;--spectrum-transparent-black-300-opacity:.25;--spectrum-transparent-black-300:rgba(var(--spectrum-transparent-black-300-rgb),var(--spectrum-transparent-black-300-opacity));--spectrum-transparent-black-400-rgb:0,0,0;--spectrum-transparent-black-400-opacity:.4;--spectrum-transparent-black-400:rgba(var(--spectrum-transparent-black-400-rgb),var(--spectrum-transparent-black-400-opacity));--spectrum-transparent-black-500-rgb:0,0,0;--spectrum-transparent-black-500-opacity:.55;--spectrum-transparent-black-500:rgba(var(--spectrum-transparent-black-500-rgb),var(--spectrum-transparent-black-500-opacity));--spectrum-transparent-black-600-rgb:0,0,0;--spectrum-transparent-black-600-opacity:.7;--spectrum-transparent-black-600:rgba(var(--spectrum-transparent-black-600-rgb),var(--spectrum-transparent-black-600-opacity));--spectrum-transparent-black-700-rgb:0,0,0;--spectrum-transparent-black-700-opacity:.8;--spectrum-transparent-black-700:rgba(var(--spectrum-transparent-black-700-rgb),var(--spectrum-transparent-black-700-opacity));--spectrum-transparent-black-800-rgb:0,0,0;--spectrum-transparent-black-800-opacity:.9;--spectrum-transparent-black-800:rgba(var(--spectrum-transparent-black-800-rgb),var(--spectrum-transparent-black-800-opacity));--spectrum-transparent-black-900-rgb:0,0,0;--spectrum-transparent-black-900:rgba(var(--spectrum-transparent-black-900-rgb));--spectrum-icon-color-inverse:var(--spectrum-gray-50);--spectrum-icon-color-primary-default:var(--spectrum-neutral-content-color-default);--spectrum-asterisk-icon-size-75:8px;--spectrum-radio-button-selection-indicator:4px;--spectrum-field-label-top-margin-small:0px;--spectrum-field-label-to-component:0px;--spectrum-help-text-to-component:0px;--spectrum-status-light-dot-size-small:8px;--spectrum-action-button-edge-to-hold-icon-extra-small:3px;--spectrum-action-button-edge-to-hold-icon-small:3px;--spectrum-button-minimum-width-multiplier:2.25;--spectrum-divider-thickness-small:1px;--spectrum-divider-thickness-medium:2px;--spectrum-divider-thickness-large:4px;--spectrum-swatch-rectangle-width-multiplier:2;--spectrum-swatch-slash-thickness-extra-small:2px;--spectrum-swatch-slash-thickness-small:3px;--spectrum-swatch-slash-thickness-medium:4px;--spectrum-swatch-slash-thickness-large:5px;--spectrum-progress-bar-minimum-width:48px;--spectrum-progress-bar-maximum-width:768px;--spectrum-meter-minimum-width:48px;--spectrum-meter-maximum-width:768px;--spectrum-meter-default-width:var(--spectrum-meter-width);--spectrum-in-line-alert-minimum-width:240px;--spectrum-popover-tip-width:16px;--spectrum-popover-tip-height:8px;--spectrum-menu-item-label-to-description:1px;--spectrum-menu-item-section-divider-height:8px;--spectrum-picker-minimum-width-multiplier:2;--spectrum-picker-end-edge-to-disclousure-icon-quiet:var(--spectrum-picker-end-edge-to-disclosure-icon-quiet);--spectrum-picker-end-edge-to-disclosure-icon-quiet:0px;--spectrum-text-field-minimum-width-multiplier:1.5;--spectrum-combo-box-minimum-width-multiplier:2.5;--spectrum-combo-box-quiet-minimum-width-multiplier:2;--spectrum-combo-box-visual-to-field-button-quiet:0px;--spectrum-alert-dialog-minimum-width:288px;--spectrum-alert-dialog-maximum-width:480px;--spectrum-contextual-help-minimum-width:268px;--spectrum-breadcrumbs-height:var(--spectrum-component-height-300);--spectrum-breadcrumbs-height-compact:var(--spectrum-component-height-200);--spectrum-breadcrumbs-end-edge-to-text:0px;--spectrum-breadcrumbs-truncated-menu-to-separator-icon:0px;--spectrum-breadcrumbs-start-edge-to-truncated-menu:0px;--spectrum-breadcrumbs-truncated-menu-to-bottom-text:0px;--spectrum-alert-banner-to-top-workflow-icon:var(--spectrum-alert-banner-top-to-workflow-icon);--spectrum-alert-banner-to-top-text:var(--spectrum-alert-banner-top-to-text);--spectrum-alert-banner-to-bottom-text:var(--spectrum-alert-banner-bottom-to-text);--spectrum-color-area-border-width:var(--spectrum-border-width-100);--spectrum-color-area-border-rounding:var(--spectrum-corner-radius-100);--spectrum-color-wheel-color-area-margin:12px;--spectrum-color-slider-border-width:1px;--spectrum-color-slider-border-rounding:4px;--spectrum-floating-action-button-drop-shadow-blur:12px;--spectrum-floating-action-button-drop-shadow-y:4px;--spectrum-illustrated-message-maximum-width:380px;--spectrum-search-field-minimum-width-multiplier:3;--spectrum-color-loupe-height:64px;--spectrum-color-loupe-width:48px;--spectrum-color-loupe-bottom-to-color-handle:12px;--spectrum-color-loupe-outer-border-width:var(--spectrum-border-width-200);--spectrum-color-loupe-inner-border-width:1px;--spectrum-color-loupe-drop-shadow-y:2px;--spectrum-color-loupe-drop-shadow-blur:8px;--spectrum-card-minimum-width:100px;--spectrum-card-preview-minimum-height:130px;--spectrum-card-selection-background-size:40px;--spectrum-drop-zone-width:428px;--spectrum-drop-zone-content-maximum-width:var(--spectrum-illustrated-message-maximum-width);--spectrum-drop-zone-border-dash-length:8px;--spectrum-drop-zone-border-dash-gap:4px;--spectrum-drop-zone-title-size:var(--spectrum-illustrated-message-title-size);--spectrum-drop-zone-cjk-title-size:var(--spectrum-illustrated-message-cjk-title-size);--spectrum-drop-zone-body-size:var(--spectrum-illustrated-message-body-size);--spectrum-accordion-top-to-text-compact-small:2px;--spectrum-accordion-top-to-text-compact-medium:4px;--spectrum-accordion-disclosure-indicator-to-text:0px;--spectrum-accordion-edge-to-disclosure-indicator:0px;--spectrum-accordion-edge-to-text:0px;--spectrum-accordion-focus-indicator-gap:0px;--spectrum-color-handle-border-width:var(--spectrum-border-width-200);--spectrum-color-handle-inner-border-width:1px;--spectrum-color-handle-outer-border-width:1px;--spectrum-color-handle-drop-shadow-x:0;--spectrum-color-handle-drop-shadow-y:0;--spectrum-color-handle-drop-shadow-blur:0;--spectrum-table-row-height-small-compact:var(--spectrum-component-height-75);--spectrum-table-row-height-medium-compact:var(--spectrum-component-height-100);--spectrum-table-row-height-large-compact:var(--spectrum-component-height-200);--spectrum-table-row-height-extra-large-compact:var(--spectrum-component-height-300);--spectrum-table-row-top-to-text-small-compact:var(--spectrum-component-top-to-text-75);--spectrum-table-row-top-to-text-medium-compact:var(--spectrum-component-top-to-text-100);--spectrum-table-row-top-to-text-large-compact:var(--spectrum-component-top-to-text-200);--spectrum-table-row-top-to-text-extra-large-compact:var(--spectrum-component-top-to-text-300);--spectrum-table-row-bottom-to-text-small-compact:var(--spectrum-component-bottom-to-text-75);--spectrum-table-row-bottom-to-text-medium-compact:var(--spectrum-component-bottom-to-text-100);--spectrum-table-row-bottom-to-text-large-compact:var(--spectrum-component-bottom-to-text-200);--spectrum-table-row-bottom-to-text-extra-large-compact:var(--spectrum-component-bottom-to-text-300);--spectrum-table-edge-to-content:16px;--spectrum-table-border-divider-width:1px;--spectrum-tab-item-height-small:var(--spectrum-component-height-200);--spectrum-tab-item-height-medium:var(--spectrum-component-height-300);--spectrum-tab-item-height-large:var(--spectrum-component-height-400);--spectrum-tab-item-height-extra-large:var(--spectrum-component-height-500);--spectrum-tab-item-compact-height-small:var(--spectrum-component-height-75);--spectrum-tab-item-compact-height-medium:var(--spectrum-component-height-100);--spectrum-tab-item-compact-height-large:var(--spectrum-component-height-200);--spectrum-tab-item-compact-height-extra-large:var(--spectrum-component-height-300);--spectrum-tab-item-start-to-edge-quiet:0px;--spectrum-in-field-button-width-stacked-small:20px;--spectrum-in-field-button-width-stacked-medium:28px;--spectrum-in-field-button-width-stacked-large:36px;--spectrum-in-field-button-width-stacked-extra-large:44px;--spectrum-in-field-button-edge-to-disclosure-icon-stacked-small:7px;--spectrum-in-field-button-edge-to-disclosure-icon-stacked-medium:9px;--spectrum-in-field-button-edge-to-disclosure-icon-stacked-large:13px;--spectrum-in-field-button-edge-to-disclosure-icon-stacked-extra-large:16px;--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-small:3px;--spectrum-android-elevation:2dp;--spectrum-spacing-50:2px;--spectrum-spacing-75:4px;--spectrum-spacing-100:8px;--spectrum-spacing-200:12px;--spectrum-spacing-300:16px;--spectrum-spacing-400:24px;--spectrum-spacing-500:32px;--spectrum-spacing-600:40px;--spectrum-spacing-700:48px;--spectrum-spacing-800:64px;--spectrum-spacing-900:80px;--spectrum-spacing-1000:96px;--spectrum-focus-indicator-thickness:2px;--spectrum-focus-indicator-gap:2px;--spectrum-border-width-200:2px;--spectrum-border-width-400:4px;--spectrum-field-edge-to-text-quiet:0px;--spectrum-field-edge-to-visual-quiet:0px;--spectrum-field-edge-to-border-quiet:0px;--spectrum-field-edge-to-alert-icon-quiet:0px;--spectrum-field-edge-to-validation-icon-quiet:0px;--spectrum-text-underline-thickness:1px;--spectrum-text-underline-gap:1px;--spectrum-informative-color-100:var(--spectrum-blue-100);--spectrum-informative-color-200:var(--spectrum-blue-200);--spectrum-informative-color-300:var(--spectrum-blue-300);--spectrum-informative-color-400:var(--spectrum-blue-400);--spectrum-informative-color-500:var(--spectrum-blue-500);--spectrum-informative-color-600:var(--spectrum-blue-600);--spectrum-informative-color-700:var(--spectrum-blue-700);--spectrum-informative-color-800:var(--spectrum-blue-800);--spectrum-informative-color-900:var(--spectrum-blue-900);--spectrum-informative-color-1000:var(--spectrum-blue-1000);--spectrum-informative-color-1100:var(--spectrum-blue-1100);--spectrum-informative-color-1200:var(--spectrum-blue-1200);--spectrum-informative-color-1300:var(--spectrum-blue-1300);--spectrum-informative-color-1400:var(--spectrum-blue-1400);--spectrum-negative-color-100:var(--spectrum-red-100);--spectrum-negative-color-200:var(--spectrum-red-200);--spectrum-negative-color-300:var(--spectrum-red-300);--spectrum-negative-color-400:var(--spectrum-red-400);--spectrum-negative-color-500:var(--spectrum-red-500);--spectrum-negative-color-600:var(--spectrum-red-600);--spectrum-negative-color-700:var(--spectrum-red-700);--spectrum-negative-color-800:var(--spectrum-red-800);--spectrum-negative-color-900:var(--spectrum-red-900);--spectrum-negative-color-1000:var(--spectrum-red-1000);--spectrum-negative-color-1100:var(--spectrum-red-1100);--spectrum-negative-color-1200:var(--spectrum-red-1200);--spectrum-negative-color-1300:var(--spectrum-red-1300);--spectrum-negative-color-1400:var(--spectrum-red-1400);--spectrum-notice-color-100:var(--spectrum-orange-100);--spectrum-notice-color-200:var(--spectrum-orange-200);--spectrum-notice-color-300:var(--spectrum-orange-300);--spectrum-notice-color-400:var(--spectrum-orange-400);--spectrum-notice-color-500:var(--spectrum-orange-500);--spectrum-notice-color-600:var(--spectrum-orange-600);--spectrum-notice-color-700:var(--spectrum-orange-700);--spectrum-notice-color-800:var(--spectrum-orange-800);--spectrum-notice-color-900:var(--spectrum-orange-900);--spectrum-notice-color-1000:var(--spectrum-orange-1000);--spectrum-notice-color-1100:var(--spectrum-orange-1100);--spectrum-notice-color-1200:var(--spectrum-orange-1200);--spectrum-notice-color-1300:var(--spectrum-orange-1300);--spectrum-notice-color-1400:var(--spectrum-orange-1400);--spectrum-positive-color-100:var(--spectrum-green-100);--spectrum-positive-color-200:var(--spectrum-green-200);--spectrum-positive-color-300:var(--spectrum-green-300);--spectrum-positive-color-400:var(--spectrum-green-400);--spectrum-positive-color-500:var(--spectrum-green-500);--spectrum-positive-color-600:var(--spectrum-green-600);--spectrum-positive-color-700:var(--spectrum-green-700);--spectrum-positive-color-800:var(--spectrum-green-800);--spectrum-positive-color-900:var(--spectrum-green-900);--spectrum-positive-color-1000:var(--spectrum-green-1000);--spectrum-positive-color-1100:var(--spectrum-green-1100);--spectrum-positive-color-1200:var(--spectrum-green-1200);--spectrum-positive-color-1300:var(--spectrum-green-1300);--spectrum-positive-color-1400:var(--spectrum-green-1400);--spectrum-default-font-family:var(--spectrum-sans-serif-font-family);--spectrum-sans-serif-font-family:Adobe Clean;--spectrum-serif-font-family:Adobe Clean Serif;--spectrum-cjk-font-family:Adobe Clean Han;--spectrum-light-font-weight:300;--spectrum-regular-font-weight:400;--spectrum-medium-font-weight:500;--spectrum-bold-font-weight:700;--spectrum-extra-bold-font-weight:800;--spectrum-black-font-weight:900;--spectrum-italic-font-style:italic;--spectrum-default-font-style:normal;--spectrum-line-height-100:1.3;--spectrum-line-height-200:1.5;--spectrum-cjk-line-height-100:1.5;--spectrum-cjk-line-height-200:1.7;--spectrum-cjk-letter-spacing:.05em;--spectrum-heading-sans-serif-font-family:var(--spectrum-sans-serif-font-family);--spectrum-heading-serif-font-family:var(--spectrum-serif-font-family);--spectrum-heading-cjk-font-family:var(--spectrum-cjk-font-family);--spectrum-heading-sans-serif-light-font-weight:var(--spectrum-light-font-weight);--spectrum-heading-sans-serif-light-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-light-font-weight:var(--spectrum-regular-font-weight);--spectrum-heading-serif-light-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-light-font-weight:var(--spectrum-light-font-weight);--spectrum-heading-cjk-light-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-heavy-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-heavy-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-heavy-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-heavy-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-heavy-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-heavy-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-light-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-sans-serif-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-light-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-serif-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-light-strong-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-heading-cjk-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-heavy-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-heavy-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-serif-heavy-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-heavy-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-cjk-heavy-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-heavy-strong-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-light-emphasized-font-weight:var(--spectrum-light-font-weight);--spectrum-heading-sans-serif-light-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-light-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-heading-serif-light-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-light-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-heading-cjk-light-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-heavy-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-heavy-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-heavy-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-heavy-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-heavy-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-heavy-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-light-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-sans-serif-light-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-light-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-serif-light-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-light-strong-emphasized-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-heading-cjk-light-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-sans-serif-heavy-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-sans-serif-heavy-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-serif-heavy-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-serif-heavy-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-heading-cjk-heavy-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-heading-cjk-heavy-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-heading-size-xxxl:var(--spectrum-font-size-1300);--spectrum-heading-size-xxl:var(--spectrum-font-size-1100);--spectrum-heading-size-xl:var(--spectrum-font-size-900);--spectrum-heading-size-l:var(--spectrum-font-size-700);--spectrum-heading-size-m:var(--spectrum-font-size-500);--spectrum-heading-size-s:var(--spectrum-font-size-300);--spectrum-heading-size-xs:var(--spectrum-font-size-200);--spectrum-heading-size-xxs:var(--spectrum-font-size-100);--spectrum-heading-cjk-size-xxxl:var(--spectrum-font-size-1300);--spectrum-heading-cjk-size-xxl:var(--spectrum-font-size-900);--spectrum-heading-cjk-size-xl:var(--spectrum-font-size-800);--spectrum-heading-cjk-size-l:var(--spectrum-font-size-600);--spectrum-heading-cjk-size-m:var(--spectrum-font-size-400);--spectrum-heading-cjk-size-s:var(--spectrum-font-size-300);--spectrum-heading-cjk-size-xs:var(--spectrum-font-size-200);--spectrum-heading-cjk-size-xxs:var(--spectrum-font-size-100);--spectrum-heading-line-height:var(--spectrum-line-height-100);--spectrum-heading-cjk-line-height:var(--spectrum-cjk-line-height-100);--spectrum-heading-margin-top-multiplier:.888889;--spectrum-heading-margin-bottom-multiplier:.25;--spectrum-heading-color:var(--spectrum-gray-900);--spectrum-body-sans-serif-font-family:var(--spectrum-sans-serif-font-family);--spectrum-body-serif-font-family:var(--spectrum-serif-font-family);--spectrum-body-cjk-font-family:var(--spectrum-cjk-font-family);--spectrum-body-sans-serif-font-weight:var(--spectrum-regular-font-weight);--spectrum-body-sans-serif-font-style:var(--spectrum-default-font-style);--spectrum-body-serif-font-weight:var(--spectrum-regular-font-weight);--spectrum-body-serif-font-style:var(--spectrum-default-font-style);--spectrum-body-cjk-font-weight:var(--spectrum-regular-font-weight);--spectrum-body-cjk-font-style:var(--spectrum-default-font-style);--spectrum-body-sans-serif-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-body-sans-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-body-serif-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-body-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-body-cjk-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-body-cjk-strong-font-style:var(--spectrum-default-font-style);--spectrum-body-sans-serif-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-body-sans-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-body-serif-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-body-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-body-cjk-emphasized-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-body-cjk-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-body-sans-serif-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-body-sans-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-body-serif-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-body-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-body-cjk-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-body-cjk-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-body-size-xxxl:var(--spectrum-font-size-600);--spectrum-body-size-xxl:var(--spectrum-font-size-500);--spectrum-body-size-xl:var(--spectrum-font-size-400);--spectrum-body-size-l:var(--spectrum-font-size-300);--spectrum-body-size-m:var(--spectrum-font-size-200);--spectrum-body-size-s:var(--spectrum-font-size-100);--spectrum-body-size-xs:var(--spectrum-font-size-75);--spectrum-body-line-height:var(--spectrum-line-height-200);--spectrum-body-cjk-line-height:var(--spectrum-cjk-line-height-200);--spectrum-body-margin-multiplier:.75;--spectrum-body-color:var(--spectrum-gray-800);--spectrum-detail-sans-serif-font-family:var(--spectrum-sans-serif-font-family);--spectrum-detail-serif-font-family:var(--spectrum-serif-font-family);--spectrum-detail-cjk-font-family:var(--spectrum-cjk-font-family);--spectrum-detail-sans-serif-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-sans-serif-font-style:var(--spectrum-default-font-style);--spectrum-detail-serif-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-serif-font-style:var(--spectrum-default-font-style);--spectrum-detail-cjk-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-detail-cjk-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-light-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-sans-serif-light-font-style:var(--spectrum-default-font-style);--spectrum-detail-serif-light-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-serif-light-font-style:var(--spectrum-default-font-style);--spectrum-detail-cjk-light-font-weight:var(--spectrum-light-font-weight);--spectrum-detail-cjk-light-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-sans-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-serif-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-serif-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-cjk-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-detail-cjk-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-light-strong-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-sans-serif-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-serif-light-strong-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-serif-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-cjk-light-strong-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-detail-cjk-light-strong-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-sans-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-serif-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-serif-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-cjk-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-detail-cjk-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-light-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-sans-serif-light-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-serif-light-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-serif-light-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-cjk-light-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-cjk-light-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-sans-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-serif-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-detail-serif-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-cjk-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-detail-cjk-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-detail-sans-serif-light-strong-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-sans-serif-light-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-serif-light-strong-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-detail-serif-light-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-detail-cjk-light-strong-emphasized-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-detail-cjk-light-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-detail-size-xl:var(--spectrum-font-size-200);--spectrum-detail-size-l:var(--spectrum-font-size-100);--spectrum-detail-size-m:var(--spectrum-font-size-75);--spectrum-detail-size-s:var(--spectrum-font-size-50);--spectrum-detail-line-height:var(--spectrum-line-height-100);--spectrum-detail-cjk-line-height:var(--spectrum-cjk-line-height-100);--spectrum-detail-margin-top-multiplier:.888889;--spectrum-detail-margin-bottom-multiplier:.25;--spectrum-detail-letter-spacing:.06em;--spectrum-detail-sans-serif-text-transform:uppercase;--spectrum-detail-serif-text-transform:uppercase;--spectrum-detail-color:var(--spectrum-gray-900);--spectrum-code-font-family:Source Code Pro;--spectrum-code-cjk-font-family:var(--spectrum-code-font-family);--spectrum-code-font-weight:var(--spectrum-regular-font-weight);--spectrum-code-font-style:var(--spectrum-default-font-style);--spectrum-code-cjk-font-weight:var(--spectrum-regular-font-weight);--spectrum-code-cjk-font-style:var(--spectrum-default-font-style);--spectrum-code-strong-font-weight:var(--spectrum-bold-font-weight);--spectrum-code-strong-font-style:var(--spectrum-default-font-style);--spectrum-code-cjk-strong-font-weight:var(--spectrum-black-font-weight);--spectrum-code-cjk-strong-font-style:var(--spectrum-default-font-style);--spectrum-code-emphasized-font-weight:var(--spectrum-regular-font-weight);--spectrum-code-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-code-cjk-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-code-cjk-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-code-strong-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-code-strong-emphasized-font-style:var(--spectrum-italic-font-style);--spectrum-code-cjk-strong-emphasized-font-weight:var(--spectrum-black-font-weight);--spectrum-code-cjk-strong-emphasized-font-style:var(--spectrum-default-font-style);--spectrum-code-size-xl:var(--spectrum-font-size-400);--spectrum-code-size-l:var(--spectrum-font-size-300);--spectrum-code-size-m:var(--spectrum-font-size-200);--spectrum-code-size-s:var(--spectrum-font-size-100);--spectrum-code-size-xs:var(--spectrum-font-size-75);--spectrum-code-line-height:var(--spectrum-line-height-200);--spectrum-code-cjk-line-height:var(--spectrum-cjk-line-height-200);--spectrum-code-color:var(--spectrum-gray-800);--spectrum-neutral-background-color-selected-default:var(--spectrum-gray-700);--spectrum-neutral-background-color-selected-hover:var(--spectrum-gray-800);--spectrum-neutral-background-color-selected-down:var(--spectrum-gray-900);--spectrum-neutral-background-color-selected-key-focus:var(--spectrum-gray-800);--spectrum-slider-track-thickness:2px;--spectrum-slider-handle-gap:4px;--spectrum-picker-border-width:var(--spectrum-border-width-100);--spectrum-in-field-button-fill-stacked-inner-border-rounding:0px;--spectrum-in-field-button-edge-to-fill:0px;--spectrum-in-field-button-stacked-inner-edge-to-fill:0px;--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-medium:3px;--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-large:4px;--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-extra-large:5px;--spectrum-in-field-button-inner-edge-to-disclosure-icon-stacked-small:var(--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-small);--spectrum-in-field-button-inner-edge-to-disclosure-icon-stacked-medium:var(--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-medium);--spectrum-in-field-button-inner-edge-to-disclosure-icon-stacked-large:var(--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-large);--spectrum-in-field-button-inner-edge-to-disclosure-icon-stacked-extra-large:var(--spectrum-in-field-button-outer-edge-to-disclosure-icon-stacked-extra-large);--spectrum-corner-radius-75:2px;--spectrum-drop-shadow-x:0px;--spectrum-border-width-100:1px;--spectrum-accent-color-100:var(--spectrum-blue-100);--spectrum-accent-color-200:var(--spectrum-blue-200);--spectrum-accent-color-300:var(--spectrum-blue-300);--spectrum-accent-color-400:var(--spectrum-blue-400);--spectrum-accent-color-500:var(--spectrum-blue-500);--spectrum-accent-color-600:var(--spectrum-blue-600);--spectrum-accent-color-700:var(--spectrum-blue-700);--spectrum-accent-color-800:var(--spectrum-blue-800);--spectrum-accent-color-900:var(--spectrum-blue-900);--spectrum-accent-color-1000:var(--spectrum-blue-1000);--spectrum-accent-color-1100:var(--spectrum-blue-1100);--spectrum-accent-color-1200:var(--spectrum-blue-1200);--spectrum-accent-color-1300:var(--spectrum-blue-1300);--spectrum-accent-color-1400:var(--spectrum-blue-1400);--spectrum-heading-sans-serif-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-serif-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-cjk-font-weight:var(--spectrum-extra-bold-font-weight);--spectrum-heading-sans-serif-emphasized-font-weight:var(--spectrum-bold-font-weight);--spectrum-heading-serif-emphasized-font-weight:var(--spectrum-bold-font-weight);--system-spectrum-actionbutton-background-color-default:var(--spectrum-gray-75);--system-spectrum-actionbutton-background-color-hover:var(--spectrum-gray-200);--system-spectrum-actionbutton-background-color-down:var(--spectrum-gray-300);--system-spectrum-actionbutton-background-color-focus:var(--spectrum-gray-200);--system-spectrum-actionbutton-border-color-default:var(--spectrum-gray-400);--system-spectrum-actionbutton-border-color-hover:var(--spectrum-gray-500);--system-spectrum-actionbutton-border-color-down:var(--spectrum-gray-600);--system-spectrum-actionbutton-border-color-focus:var(--spectrum-gray-500);--system-spectrum-actionbutton-background-color-disabled:transparent;--system-spectrum-actionbutton-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-actionbutton-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-actionbutton-quiet-background-color-default:transparent;--system-spectrum-actionbutton-quiet-background-color-hover:var(--spectrum-gray-200);--system-spectrum-actionbutton-quiet-background-color-down:var(--spectrum-gray-300);--system-spectrum-actionbutton-quiet-background-color-focus:var(--spectrum-gray-200);--system-spectrum-actionbutton-quiet-border-color-default:transparent;--system-spectrum-actionbutton-quiet-border-color-hover:transparent;--system-spectrum-actionbutton-quiet-border-color-down:transparent;--system-spectrum-actionbutton-quiet-border-color-focus:transparent;--system-spectrum-actionbutton-quiet-background-color-disabled:transparent;--system-spectrum-actionbutton-quiet-border-color-disabled:transparent;--system-spectrum-actionbutton-selected-border-color-default:transparent;--system-spectrum-actionbutton-selected-border-color-hover:transparent;--system-spectrum-actionbutton-selected-border-color-down:transparent;--system-spectrum-actionbutton-selected-border-color-focus:transparent;--system-spectrum-actionbutton-selected-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-actionbutton-selected-border-color-disabled:transparent;--system-spectrum-actionbutton-staticblack-quiet-border-color-default:transparent;--system-spectrum-actionbutton-staticwhite-quiet-border-color-default:transparent;--system-spectrum-actionbutton-staticblack-quiet-border-color-hover:transparent;--system-spectrum-actionbutton-staticwhite-quiet-border-color-hover:transparent;--system-spectrum-actionbutton-staticblack-quiet-border-color-down:transparent;--system-spectrum-actionbutton-staticwhite-quiet-border-color-down:transparent;--system-spectrum-actionbutton-staticblack-quiet-border-color-focus:transparent;--system-spectrum-actionbutton-staticwhite-quiet-border-color-focus:transparent;--system-spectrum-actionbutton-staticblack-quiet-border-color-disabled:transparent;--system-spectrum-actionbutton-staticwhite-quiet-border-color-disabled:transparent;--system-spectrum-actionbutton-staticblack-background-color-default:transparent;--system-spectrum-actionbutton-staticblack-background-color-hover:var(--spectrum-transparent-black-300);--system-spectrum-actionbutton-staticblack-background-color-down:var(--spectrum-transparent-black-400);--system-spectrum-actionbutton-staticblack-background-color-focus:var(--spectrum-transparent-black-300);--system-spectrum-actionbutton-staticblack-border-color-default:var(--spectrum-transparent-black-400);--system-spectrum-actionbutton-staticblack-border-color-hover:var(--spectrum-transparent-black-500);--system-spectrum-actionbutton-staticblack-border-color-down:var(--spectrum-transparent-black-600);--system-spectrum-actionbutton-staticblack-border-color-focus:var(--spectrum-transparent-black-500);--system-spectrum-actionbutton-staticblack-content-color-default:var(--spectrum-black);--system-spectrum-actionbutton-staticblack-content-color-hover:var(--spectrum-black);--system-spectrum-actionbutton-staticblack-content-color-down:var(--spectrum-black);--system-spectrum-actionbutton-staticblack-content-color-focus:var(--spectrum-black);--system-spectrum-actionbutton-staticblack-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color);--system-spectrum-actionbutton-staticblack-background-color-disabled:transparent;--system-spectrum-actionbutton-staticblack-border-color-disabled:var(--spectrum-disabled-static-black-border-color);--system-spectrum-actionbutton-staticblack-content-color-disabled:var(--spectrum-disabled-static-black-content-color);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-default:var(--spectrum-transparent-black-800);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-hover:var(--spectrum-transparent-black-900);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-down:var(--spectrum-transparent-black-900);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-focus:var(--spectrum-transparent-black-900);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-default:var(--spectrum-white);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-hover:var(--spectrum-white);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-down:var(--spectrum-white);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-content-color-focus:var(--spectrum-white);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-background-color-disabled:var(--spectrum-disabled-static-black-background-color);--system-spectrum-actionbutton-staticblack-selected-mod-actionbutton-border-color-disabled:transparent;--system-spectrum-actionbutton-staticwhite-background-color-default:transparent;--system-spectrum-actionbutton-staticwhite-background-color-hover:var(--spectrum-transparent-white-300);--system-spectrum-actionbutton-staticwhite-background-color-down:var(--spectrum-transparent-white-400);--system-spectrum-actionbutton-staticwhite-background-color-focus:var(--spectrum-transparent-white-300);--system-spectrum-actionbutton-staticwhite-border-color-default:var(--spectrum-transparent-white-400);--system-spectrum-actionbutton-staticwhite-border-color-hover:var(--spectrum-transparent-white-500);--system-spectrum-actionbutton-staticwhite-border-color-down:var(--spectrum-transparent-white-600);--system-spectrum-actionbutton-staticwhite-border-color-focus:var(--spectrum-transparent-white-500);--system-spectrum-actionbutton-staticwhite-content-color-default:var(--spectrum-white);--system-spectrum-actionbutton-staticwhite-content-color-hover:var(--spectrum-white);--system-spectrum-actionbutton-staticwhite-content-color-down:var(--spectrum-white);--system-spectrum-actionbutton-staticwhite-content-color-focus:var(--spectrum-white);--system-spectrum-actionbutton-staticwhite-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color);--system-spectrum-actionbutton-staticwhite-background-color-disabled:transparent;--system-spectrum-actionbutton-staticwhite-border-color-disabled:var(--spectrum-disabled-static-white-border-color);--system-spectrum-actionbutton-staticwhite-content-color-disabled:var(--spectrum-disabled-static-white-content-color);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-default:var(--spectrum-transparent-white-800);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-hover:var(--spectrum-transparent-white-900);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-down:var(--spectrum-transparent-white-900);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-focus:var(--spectrum-transparent-white-900);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-default:var(--spectrum-black);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-hover:var(--spectrum-black);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-down:var(--spectrum-black);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-content-color-focus:var(--spectrum-black);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-background-color-disabled:var(--spectrum-disabled-static-white-background-color);--system-spectrum-actionbutton-staticwhite-selected-mod-actionbutton-border-color-disabled:transparent;--system-spectrum-actiongroup-gap-size-compact:0;--system-spectrum-actiongroup-horizontal-spacing-compact:-1px;--system-spectrum-actiongroup-vertical-spacing-compact:-1px;--system-spectrum-button-background-color-default:var(--spectrum-gray-75);--system-spectrum-button-background-color-hover:var(--spectrum-gray-200);--system-spectrum-button-background-color-down:var(--spectrum-gray-300);--system-spectrum-button-background-color-focus:var(--spectrum-gray-200);--system-spectrum-button-border-color-default:var(--spectrum-gray-400);--system-spectrum-button-border-color-hover:var(--spectrum-gray-500);--system-spectrum-button-border-color-down:var(--spectrum-gray-600);--system-spectrum-button-border-color-focus:var(--spectrum-gray-500);--system-spectrum-button-content-color-default:var(--spectrum-neutral-content-color-default);--system-spectrum-button-content-color-hover:var(--spectrum-neutral-content-color-hover);--system-spectrum-button-content-color-down:var(--spectrum-neutral-content-color-down);--system-spectrum-button-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--system-spectrum-button-background-color-disabled:transparent;--system-spectrum-button-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-button-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-accent-background-color-default:var(--spectrum-accent-background-color-default);--system-spectrum-button-accent-background-color-hover:var(--spectrum-accent-background-color-hover);--system-spectrum-button-accent-background-color-down:var(--spectrum-accent-background-color-down);--system-spectrum-button-accent-background-color-focus:var(--spectrum-accent-background-color-key-focus);--system-spectrum-button-accent-border-color-default:transparent;--system-spectrum-button-accent-border-color-hover:transparent;--system-spectrum-button-accent-border-color-down:transparent;--system-spectrum-button-accent-border-color-focus:transparent;--system-spectrum-button-accent-content-color-default:var(--spectrum-white);--system-spectrum-button-accent-content-color-hover:var(--spectrum-white);--system-spectrum-button-accent-content-color-down:var(--spectrum-white);--system-spectrum-button-accent-content-color-focus:var(--spectrum-white);--system-spectrum-button-accent-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-button-accent-border-color-disabled:transparent;--system-spectrum-button-accent-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-accent-outline-background-color-default:transparent;--system-spectrum-button-accent-outline-background-color-hover:var(--spectrum-accent-color-200);--system-spectrum-button-accent-outline-background-color-down:var(--spectrum-accent-color-300);--system-spectrum-button-accent-outline-background-color-focus:var(--spectrum-accent-color-200);--system-spectrum-button-accent-outline-border-color-default:var(--spectrum-accent-color-900);--system-spectrum-button-accent-outline-border-color-hover:var(--spectrum-accent-color-1000);--system-spectrum-button-accent-outline-border-color-down:var(--spectrum-accent-color-1100);--system-spectrum-button-accent-outline-border-color-focus:var(--spectrum-accent-color-1000);--system-spectrum-button-accent-outline-content-color-default:var(--spectrum-accent-content-color-default);--system-spectrum-button-accent-outline-content-color-hover:var(--spectrum-accent-content-color-hover);--system-spectrum-button-accent-outline-content-color-down:var(--spectrum-accent-content-color-down);--system-spectrum-button-accent-outline-content-color-focus:var(--spectrum-accent-content-color-key-focus);--system-spectrum-button-accent-outline-background-color-disabled:transparent;--system-spectrum-button-accent-outline-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-button-accent-outline-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-negative-background-color-default:var(--spectrum-negative-background-color-default);--system-spectrum-button-negative-background-color-hover:var(--spectrum-negative-background-color-hover);--system-spectrum-button-negative-background-color-down:var(--spectrum-negative-background-color-down);--system-spectrum-button-negative-background-color-focus:var(--spectrum-negative-background-color-key-focus);--system-spectrum-button-negative-border-color-default:transparent;--system-spectrum-button-negative-border-color-hover:transparent;--system-spectrum-button-negative-border-color-down:transparent;--system-spectrum-button-negative-border-color-focus:transparent;--system-spectrum-button-negative-content-color-default:var(--spectrum-white);--system-spectrum-button-negative-content-color-hover:var(--spectrum-white);--system-spectrum-button-negative-content-color-down:var(--spectrum-white);--system-spectrum-button-negative-content-color-focus:var(--spectrum-white);--system-spectrum-button-negative-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-button-negative-border-color-disabled:transparent;--system-spectrum-button-negative-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-negative-outline-background-color-default:transparent;--system-spectrum-button-negative-outline-background-color-hover:var(--spectrum-negative-color-200);--system-spectrum-button-negative-outline-background-color-down:var(--spectrum-negative-color-300);--system-spectrum-button-negative-outline-background-color-focus:var(--spectrum-negative-color-200);--system-spectrum-button-negative-outline-border-color-default:var(--spectrum-negative-color-900);--system-spectrum-button-negative-outline-border-color-hover:var(--spectrum-negative-color-1000);--system-spectrum-button-negative-outline-border-color-down:var(--spectrum-negative-color-1100);--system-spectrum-button-negative-outline-border-color-focus:var(--spectrum-negative-color-1000);--system-spectrum-button-negative-outline-content-color-default:var(--spectrum-negative-content-color-default);--system-spectrum-button-negative-outline-content-color-hover:var(--spectrum-negative-content-color-hover);--system-spectrum-button-negative-outline-content-color-down:var(--spectrum-negative-content-color-down);--system-spectrum-button-negative-outline-content-color-focus:var(--spectrum-negative-content-color-key-focus);--system-spectrum-button-negative-outline-background-color-disabled:transparent;--system-spectrum-button-negative-outline-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-button-negative-outline-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-primary-background-color-default:var(--spectrum-neutral-background-color-default);--system-spectrum-button-primary-background-color-hover:var(--spectrum-neutral-background-color-hover);--system-spectrum-button-primary-background-color-down:var(--spectrum-neutral-background-color-down);--system-spectrum-button-primary-background-color-focus:var(--spectrum-neutral-background-color-key-focus);--system-spectrum-button-primary-border-color-default:transparent;--system-spectrum-button-primary-border-color-hover:transparent;--system-spectrum-button-primary-border-color-down:transparent;--system-spectrum-button-primary-border-color-focus:transparent;--system-spectrum-button-primary-content-color-default:var(--spectrum-white);--system-spectrum-button-primary-content-color-hover:var(--spectrum-white);--system-spectrum-button-primary-content-color-down:var(--spectrum-white);--system-spectrum-button-primary-content-color-focus:var(--spectrum-white);--system-spectrum-button-primary-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-button-primary-border-color-disabled:transparent;--system-spectrum-button-primary-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-primary-outline-background-color-default:transparent;--system-spectrum-button-primary-outline-background-color-hover:var(--spectrum-gray-300);--system-spectrum-button-primary-outline-background-color-down:var(--spectrum-gray-400);--system-spectrum-button-primary-outline-background-color-focus:var(--spectrum-gray-300);--system-spectrum-button-primary-outline-border-color-default:var(--spectrum-gray-800);--system-spectrum-button-primary-outline-border-color-hover:var(--spectrum-gray-900);--system-spectrum-button-primary-outline-border-color-down:var(--spectrum-gray-900);--system-spectrum-button-primary-outline-border-color-focus:var(--spectrum-gray-900);--system-spectrum-button-primary-outline-content-color-default:var(--spectrum-neutral-content-color-default);--system-spectrum-button-primary-outline-content-color-hover:var(--spectrum-neutral-content-color-hover);--system-spectrum-button-primary-outline-content-color-down:var(--spectrum-neutral-content-color-down);--system-spectrum-button-primary-outline-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--system-spectrum-button-primary-outline-background-color-disabled:transparent;--system-spectrum-button-primary-outline-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-button-primary-outline-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-secondary-background-color-default:var(--spectrum-gray-200);--system-spectrum-button-secondary-background-color-hover:var(--spectrum-gray-300);--system-spectrum-button-secondary-background-color-down:var(--spectrum-gray-400);--system-spectrum-button-secondary-background-color-focus:var(--spectrum-gray-300);--system-spectrum-button-secondary-border-color-default:transparent;--system-spectrum-button-secondary-border-color-hover:transparent;--system-spectrum-button-secondary-border-color-down:transparent;--system-spectrum-button-secondary-border-color-focus:transparent;--system-spectrum-button-secondary-content-color-default:var(--spectrum-neutral-content-color-default);--system-spectrum-button-secondary-content-color-hover:var(--spectrum-neutral-content-color-hover);--system-spectrum-button-secondary-content-color-down:var(--spectrum-neutral-content-color-down);--system-spectrum-button-secondary-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--system-spectrum-button-secondary-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-button-secondary-border-color-disabled:transparent;--system-spectrum-button-secondary-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-secondary-outline-background-color-default:transparent;--system-spectrum-button-secondary-outline-background-color-hover:var(--spectrum-gray-300);--system-spectrum-button-secondary-outline-background-color-down:var(--spectrum-gray-400);--system-spectrum-button-secondary-outline-background-color-focus:var(--spectrum-gray-300);--system-spectrum-button-secondary-outline-border-color-default:var(--spectrum-gray-300);--system-spectrum-button-secondary-outline-border-color-hover:var(--spectrum-gray-400);--system-spectrum-button-secondary-outline-border-color-down:var(--spectrum-gray-500);--system-spectrum-button-secondary-outline-border-color-focus:var(--spectrum-gray-400);--system-spectrum-button-secondary-outline-content-color-default:var(--spectrum-neutral-content-color-default);--system-spectrum-button-secondary-outline-content-color-hover:var(--spectrum-neutral-content-color-hover);--system-spectrum-button-secondary-outline-content-color-down:var(--spectrum-neutral-content-color-down);--system-spectrum-button-secondary-outline-content-color-focus:var(--spectrum-neutral-content-color-key-focus);--system-spectrum-button-secondary-outline-background-color-disabled:transparent;--system-spectrum-button-secondary-outline-border-color-disabled:var(--spectrum-disabled-border-color);--system-spectrum-button-secondary-outline-content-color-disabled:var(--spectrum-disabled-content-color);--system-spectrum-button-quiet-background-color-default:transparent;--system-spectrum-button-quiet-background-color-hover:var(--spectrum-gray-200);--system-spectrum-button-quiet-background-color-down:var(--spectrum-gray-300);--system-spectrum-button-quiet-background-color-focus:var(--spectrum-gray-200);--system-spectrum-button-quiet-border-color-default:transparent;--system-spectrum-button-quiet-border-color-hover:transparent;--system-spectrum-button-quiet-border-color-down:transparent;--system-spectrum-button-quiet-border-color-focus:transparent;--system-spectrum-button-quiet-background-color-disabled:transparent;--system-spectrum-button-quiet-border-color-disabled:transparent;--system-spectrum-button-selected-background-color-default:var(--spectrum-neutral-subdued-background-color-default);--system-spectrum-button-selected-background-color-hover:var(--spectrum-neutral-subdued-background-color-hover);--system-spectrum-button-selected-background-color-down:var(--spectrum-neutral-subdued-background-color-down);--system-spectrum-button-selected-background-color-focus:var(--spectrum-neutral-subdued-background-color-key-focus);--system-spectrum-button-selected-border-color-default:transparent;--system-spectrum-button-selected-border-color-hover:transparent;--system-spectrum-button-selected-border-color-down:transparent;--system-spectrum-button-selected-border-color-focus:transparent;--system-spectrum-button-selected-content-color-default:var(--spectrum-white);--system-spectrum-button-selected-content-color-hover:var(--spectrum-white);--system-spectrum-button-selected-content-color-down:var(--spectrum-white);--system-spectrum-button-selected-content-color-focus:var(--spectrum-white);--system-spectrum-button-selected-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-button-selected-border-color-disabled:transparent;--system-spectrum-button-selected-emphasized-background-color-default:var(--spectrum-accent-background-color-default);--system-spectrum-button-selected-emphasized-background-color-hover:var(--spectrum-accent-background-color-hover);--system-spectrum-button-selected-emphasized-background-color-down:var(--spectrum-accent-background-color-down);--system-spectrum-button-selected-emphasized-background-color-focus:var(--spectrum-accent-background-color-key-focus);--system-spectrum-button-staticblack-quiet-border-color-default:transparent;--system-spectrum-button-staticwhite-quiet-border-color-default:transparent;--system-spectrum-button-staticblack-quiet-border-color-hover:transparent;--system-spectrum-button-staticwhite-quiet-border-color-hover:transparent;--system-spectrum-button-staticblack-quiet-border-color-down:transparent;--system-spectrum-button-staticwhite-quiet-border-color-down:transparent;--system-spectrum-button-staticblack-quiet-border-color-focus:transparent;--system-spectrum-button-staticwhite-quiet-border-color-focus:transparent;--system-spectrum-button-staticblack-quiet-border-color-disabled:transparent;--system-spectrum-button-staticwhite-quiet-border-color-disabled:transparent;--system-spectrum-button-staticwhite-background-color-default:var(--spectrum-transparent-white-800);--system-spectrum-button-staticwhite-background-color-hover:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-background-color-down:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-background-color-focus:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-border-color-default:transparent;--system-spectrum-button-staticwhite-border-color-hover:transparent;--system-spectrum-button-staticwhite-border-color-down:transparent;--system-spectrum-button-staticwhite-border-color-focus:transparent;--system-spectrum-button-staticwhite-content-color-default:var(--spectrum-black);--system-spectrum-button-staticwhite-content-color-hover:var(--spectrum-black);--system-spectrum-button-staticwhite-content-color-down:var(--spectrum-black);--system-spectrum-button-staticwhite-content-color-focus:var(--spectrum-black);--system-spectrum-button-staticwhite-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color);--system-spectrum-button-staticwhite-background-color-disabled:var(--spectrum-disabled-static-white-background-color);--system-spectrum-button-staticwhite-border-color-disabled:transparent;--system-spectrum-button-staticwhite-content-color-disabled:var(--spectrum-disabled-static-white-content-color);--system-spectrum-button-staticwhite-outline-background-color-default:transparent;--system-spectrum-button-staticwhite-outline-background-color-hover:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-outline-background-color-down:var(--spectrum-transparent-white-400);--system-spectrum-button-staticwhite-outline-background-color-focus:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-outline-border-color-default:var(--spectrum-transparent-white-800);--system-spectrum-button-staticwhite-outline-border-color-hover:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-outline-border-color-down:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-outline-border-color-focus:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-outline-content-color-default:var(--spectrum-white);--system-spectrum-button-staticwhite-outline-content-color-hover:var(--spectrum-white);--system-spectrum-button-staticwhite-outline-content-color-down:var(--spectrum-white);--system-spectrum-button-staticwhite-outline-content-color-focus:var(--spectrum-white);--system-spectrum-button-staticwhite-outline-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color);--system-spectrum-button-staticwhite-outline-background-color-disabled:transparent;--system-spectrum-button-staticwhite-outline-border-color-disabled:var(--spectrum-disabled-static-white-border-color);--system-spectrum-button-staticwhite-outline-content-color-disabled:var(--spectrum-disabled-static-white-content-color);--system-spectrum-button-staticwhite-selected-background-color-default:var(--spectrum-transparent-white-800);--system-spectrum-button-staticwhite-selected-background-color-hover:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-selected-background-color-down:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-selected-background-color-focus:var(--spectrum-transparent-white-900);--system-spectrum-button-staticwhite-selected-content-color-default:var(--spectrum-black);--system-spectrum-button-staticwhite-selected-content-color-hover:var(--spectrum-black);--system-spectrum-button-staticwhite-selected-content-color-down:var(--spectrum-black);--system-spectrum-button-staticwhite-selected-content-color-focus:var(--spectrum-black);--system-spectrum-button-staticwhite-selected-background-color-disabled:var(--spectrum-disabled-static-white-background-color);--system-spectrum-button-staticwhite-selected-border-color-disabled:transparent;--system-spectrum-button-staticwhite-secondary-background-color-default:var(--spectrum-transparent-white-200);--system-spectrum-button-staticwhite-secondary-background-color-hover:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-secondary-background-color-down:var(--spectrum-transparent-white-400);--system-spectrum-button-staticwhite-secondary-background-color-focus:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-secondary-border-color-default:transparent;--system-spectrum-button-staticwhite-secondary-border-color-hover:transparent;--system-spectrum-button-staticwhite-secondary-border-color-down:transparent;--system-spectrum-button-staticwhite-secondary-border-color-focus:transparent;--system-spectrum-button-staticwhite-secondary-content-color-default:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-content-color-hover:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-content-color-down:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-content-color-focus:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color);--system-spectrum-button-staticwhite-secondary-background-color-disabled:var(--spectrum-disabled-static-white-background-color);--system-spectrum-button-staticwhite-secondary-border-color-disabled:transparent;--system-spectrum-button-staticwhite-secondary-content-color-disabled:var(--spectrum-disabled-static-white-content-color);--system-spectrum-button-staticwhite-secondary-outline-background-color-default:transparent;--system-spectrum-button-staticwhite-secondary-outline-background-color-hover:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-secondary-outline-background-color-down:var(--spectrum-transparent-white-400);--system-spectrum-button-staticwhite-secondary-outline-background-color-focus:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-secondary-outline-border-color-default:var(--spectrum-transparent-white-300);--system-spectrum-button-staticwhite-secondary-outline-border-color-hover:var(--spectrum-transparent-white-400);--system-spectrum-button-staticwhite-secondary-outline-border-color-down:var(--spectrum-transparent-white-500);--system-spectrum-button-staticwhite-secondary-outline-border-color-focus:var(--spectrum-transparent-white-400);--system-spectrum-button-staticwhite-secondary-outline-content-color-default:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-outline-content-color-hover:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-outline-content-color-down:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-outline-content-color-focus:var(--spectrum-white);--system-spectrum-button-staticwhite-secondary-outline-focus-indicator-color:var(--spectrum-static-white-focus-indicator-color);--system-spectrum-button-staticwhite-secondary-outline-background-color-disabled:transparent;--system-spectrum-button-staticwhite-secondary-outline-border-color-disabled:var(--spectrum-disabled-static-white-border-color);--system-spectrum-button-staticwhite-secondary-outline-content-color-disabled:var(--spectrum-disabled-static-white-content-color);--system-spectrum-button-staticblack-background-color-default:var(--spectrum-transparent-black-800);--system-spectrum-button-staticblack-background-color-hover:var(--spectrum-transparent-black-900);--system-spectrum-button-staticblack-background-color-down:var(--spectrum-transparent-black-900);--system-spectrum-button-staticblack-background-color-focus:var(--spectrum-transparent-black-900);--system-spectrum-button-staticblack-border-color-default:transparent;--system-spectrum-button-staticblack-border-color-hover:transparent;--system-spectrum-button-staticblack-border-color-down:transparent;--system-spectrum-button-staticblack-border-color-focus:transparent;--system-spectrum-button-staticblack-content-color-default:var(--spectrum-white);--system-spectrum-button-staticblack-content-color-hover:var(--spectrum-white);--system-spectrum-button-staticblack-content-color-down:var(--spectrum-white);--system-spectrum-button-staticblack-content-color-focus:var(--spectrum-white);--system-spectrum-button-staticblack-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color);--system-spectrum-button-staticblack-background-color-disabled:var(--spectrum-disabled-static-black-background-color);--system-spectrum-button-staticblack-border-color-disabled:transparent;--system-spectrum-button-staticblack-content-color-disabled:var(--spectrum-disabled-static-black-content-color);--system-spectrum-button-staticblack-outline-background-color-default:transparent;--system-spectrum-button-staticblack-outline-background-color-hover:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-outline-background-color-down:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-outline-background-color-focus:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-outline-border-color-default:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-outline-border-color-hover:var(--spectrum-transparent-black-500);--system-spectrum-button-staticblack-outline-border-color-down:var(--spectrum-transparent-black-600);--system-spectrum-button-staticblack-outline-border-color-focus:var(--spectrum-transparent-black-500);--system-spectrum-button-staticblack-outline-content-color-default:var(--spectrum-black);--system-spectrum-button-staticblack-outline-content-color-hover:var(--spectrum-black);--system-spectrum-button-staticblack-outline-content-color-down:var(--spectrum-black);--system-spectrum-button-staticblack-outline-content-color-focus:var(--spectrum-black);--system-spectrum-button-staticblack-outline-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color);--system-spectrum-button-staticblack-outline-background-color-disabled:transparent;--system-spectrum-button-staticblack-outline-border-color-disabled:var(--spectrum-disabled-static-black-border-color);--system-spectrum-button-staticblack-outline-content-color-disabled:var(--spectrum-disabled-static-black-content-color);--system-spectrum-button-staticblack-secondary-background-color-default:var(--spectrum-transparent-black-200);--system-spectrum-button-staticblack-secondary-background-color-hover:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-secondary-background-color-down:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-secondary-background-color-focus:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-secondary-border-color-default:transparent;--system-spectrum-button-staticblack-secondary-border-color-hover:transparent;--system-spectrum-button-staticblack-secondary-border-color-down:transparent;--system-spectrum-button-staticblack-secondary-border-color-focus:transparent;--system-spectrum-button-staticblack-secondary-content-color-default:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-content-color-hover:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-content-color-down:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-content-color-focus:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color);--system-spectrum-button-staticblack-secondary-background-color-disabled:var(--spectrum-disabled-static-black-background-color);--system-spectrum-button-staticblack-secondary-border-color-disabled:transparent;--system-spectrum-button-staticblack-secondary-content-color-disabled:var(--spectrum-disabled-static-black-content-color);--system-spectrum-button-staticblack-secondary-outline-background-color-default:transparent;--system-spectrum-button-staticblack-secondary-outline-background-color-hover:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-secondary-outline-background-color-down:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-secondary-outline-background-color-focus:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-secondary-outline-border-color-default:var(--spectrum-transparent-black-300);--system-spectrum-button-staticblack-secondary-outline-border-color-hover:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-secondary-outline-border-color-down:var(--spectrum-transparent-black-500);--system-spectrum-button-staticblack-secondary-outline-border-color-focus:var(--spectrum-transparent-black-400);--system-spectrum-button-staticblack-secondary-outline-content-color-default:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-outline-content-color-hover:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-outline-content-color-down:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-outline-content-color-focus:var(--spectrum-black);--system-spectrum-button-staticblack-secondary-outline-focus-indicator-color:var(--spectrum-static-black-focus-indicator-color);--system-spectrum-button-staticblack-secondary-outline-background-color-disabled:transparent;--system-spectrum-button-staticblack-secondary-outline-border-color-disabled:var(--spectrum-disabled-static-black-border-color);--system-spectrum-button-staticblack-secondary-outline-content-color-disabled:var(--spectrum-disabled-static-black-content-color);--system-spectrum-checkbox-control-color-default:var(--spectrum-gray-600);--system-spectrum-checkbox-control-color-hover:var(--spectrum-gray-700);--system-spectrum-checkbox-control-color-down:var(--spectrum-gray-800);--system-spectrum-checkbox-control-color-focus:var(--spectrum-gray-700);--system-spectrum-closebutton-background-color-default:transparent;--system-spectrum-closebutton-background-color-hover:var(--spectrum-gray-200);--system-spectrum-closebutton-background-color-down:var(--spectrum-gray-300);--system-spectrum-closebutton-background-color-focus:var(--spectrum-gray-200);--system-spectrum-combobox-border-color-default:var(--spectrum-gray-500);--system-spectrum-combobox-border-color-hover:var(--spectrum-gray-600);--system-spectrum-combobox-border-color-focus:var(--spectrum-gray-500);--system-spectrum-combobox-border-color-focus-hover:var(--spectrum-gray-600);--system-spectrum-combobox-border-color-key-focus:var(--spectrum-gray-600);--system-spectrum-infieldbutton-spectrum-infield-button-border-width:var(--spectrum-border-width-100);--system-spectrum-infieldbutton-spectrum-infield-button-border-color:inherit;--system-spectrum-infieldbutton-spectrum-infield-button-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-infieldbutton-spectrum-infield-button-border-radius-reset:0;--system-spectrum-infieldbutton-spectrum-infield-button-stacked-top-border-radius-start-start:var(--spectrum-infield-button-border-radius-reset);--system-spectrum-infieldbutton-spectrum-infield-button-stacked-bottom-border-radius-end-start:var(--spectrum-infield-button-border-radius-reset);--system-spectrum-infieldbutton-spectrum-infield-button-background-color:var(--spectrum-gray-75);--system-spectrum-infieldbutton-spectrum-infield-button-background-color-hover:var(--spectrum-gray-200);--system-spectrum-infieldbutton-spectrum-infield-button-background-color-down:var(--spectrum-gray-300);--system-spectrum-infieldbutton-spectrum-infield-button-background-color-key-focus:var(--spectrum-gray-200);--system-spectrum-picker-background-color-default:var(--spectrum-gray-75);--system-spectrum-picker-background-color-default-open:var(--spectrum-gray-200);--system-spectrum-picker-background-color-active:var(--spectrum-gray-300);--system-spectrum-picker-background-color-hover:var(--spectrum-gray-200);--system-spectrum-picker-background-color-hover-open:var(--spectrum-gray-200);--system-spectrum-picker-background-color-key-focus:var(--spectrum-gray-200);--system-spectrum-picker-border-color-default:var(--spectrum-gray-500);--system-spectrum-picker-border-color-default-open:var(--spectrum-gray-500);--system-spectrum-picker-border-color-hover:var(--spectrum-gray-600);--system-spectrum-picker-border-color-hover-open:var(--spectrum-gray-600);--system-spectrum-picker-border-color-active:var(--spectrum-gray-700);--system-spectrum-picker-border-color-key-focus:var(--spectrum-gray-600);--system-spectrum-picker-border-width:var(--spectrum-border-width-100);--system-spectrum-pickerbutton-spectrum-picker-button-background-color:var(--spectrum-gray-75);--system-spectrum-pickerbutton-spectrum-picker-button-background-color-hover:var(--spectrum-gray-200);--system-spectrum-pickerbutton-spectrum-picker-button-background-color-down:var(--spectrum-gray-300);--system-spectrum-pickerbutton-spectrum-picker-button-background-color-key-focus:var(--spectrum-gray-200);--system-spectrum-pickerbutton-spectrum-picker-button-border-color:inherit;--system-spectrum-pickerbutton-spectrum-picker-button-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-pickerbutton-spectrum-picker-button-border-radius-rounded-sided:0;--system-spectrum-pickerbutton-spectrum-picker-button-border-radius-sided:0;--system-spectrum-pickerbutton-spectrum-picker-button-border-width:var(--spectrum-border-width-100);--system-spectrum-popover-border-width:var(--spectrum-border-width-100);--system-spectrum-radio-button-border-color-default:var(--spectrum-gray-600);--system-spectrum-radio-button-border-color-hover:var(--spectrum-gray-700);--system-spectrum-radio-button-border-color-down:var(--spectrum-gray-800);--system-spectrum-radio-button-border-color-focus:var(--spectrum-gray-700);--system-spectrum-radio-emphasized-button-checked-border-color-default:var(--spectrum-accent-color-900);--system-spectrum-radio-emphasized-button-checked-border-color-hover:var(--spectrum-accent-color-1000);--system-spectrum-radio-emphasized-button-checked-border-color-down:var(--spectrum-accent-color-1100);--system-spectrum-radio-emphasized-button-checked-border-color-focus:var(--spectrum-accent-color-1000);--system-spectrum-search-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-search-edge-to-visual:var(--spectrum-component-edge-to-visual-100);--system-spectrum-search-border-color-default:var(--spectrum-gray-500);--system-spectrum-search-border-color-hover:var(--spectrum-gray-600);--system-spectrum-search-border-color-focus:var(--spectrum-gray-800);--system-spectrum-search-border-color-focus-hover:var(--spectrum-gray-900);--system-spectrum-search-border-color-key-focus:var(--spectrum-gray-900);--system-spectrum-search-sizes-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-search-sizes-edge-to-visual:var(--spectrum-component-edge-to-visual-75);--system-spectrum-search-sizem-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-search-sizem-edge-to-visual:var(--spectrum-component-edge-to-visual-100);--system-spectrum-search-sizel-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-search-sizel-edge-to-visual:var(--spectrum-component-edge-to-visual-200);--system-spectrum-search-sizexl-border-radius:var(--spectrum-corner-radius-100);--system-spectrum-search-sizexl-edge-to-visual:var(--spectrum-component-edge-to-visual-300);--system-spectrum-slider-track-color:var(--spectrum-gray-300);--system-spectrum-slider-track-fill-color:var(--spectrum-gray-700);--system-spectrum-slider-ramp-track-color:var(--spectrum-gray-400);--system-spectrum-slider-ramp-track-color-disabled:var(--spectrum-gray-200);--system-spectrum-slider-handle-background-color:transparent;--system-spectrum-slider-handle-background-color-disabled:transparent;--system-spectrum-slider-ramp-handle-background-color:var(--spectrum-gray-100);--system-spectrum-slider-ticks-handle-background-color:var(--spectrum-gray-100);--system-spectrum-slider-handle-border-color:var(--spectrum-gray-700);--system-spectrum-slider-handle-disabled-background-color:var(--spectrum-gray-100);--system-spectrum-slider-tick-mark-color:var(--spectrum-gray-300);--system-spectrum-slider-handle-border-color-hover:var(--spectrum-gray-800);--system-spectrum-slider-handle-border-color-down:var(--spectrum-gray-800);--system-spectrum-slider-handle-border-color-key-focus:var(--spectrum-gray-800);--system-spectrum-slider-handle-focus-ring-color-key-focus:var(--spectrum-focus-indicator-color);--system-spectrum-stepper-border-width:var(--spectrum-border-width-100);--system-spectrum-stepper-buttons-border-style:none;--system-spectrum-stepper-buttons-border-width:0;--system-spectrum-stepper-buttons-border-color:var(--spectrum-gray-500);--system-spectrum-stepper-buttons-background-color:var(--spectrum-gray-50);--system-spectrum-stepper-buttons-border-color-hover:var(--spectrum-gray-600);--system-spectrum-stepper-buttons-border-color-focus:var(--spectrum-gray-800);--system-spectrum-stepper-buttons-border-color-keyboard-focus:var(--spectrum-gray-900);--system-spectrum-stepper-button-border-radius-reset:0px;--system-spectrum-stepper-button-border-width:var(--spectrum-border-width-100);--system-spectrum-stepper-border-color:var(--spectrum-gray-500);--system-spectrum-stepper-border-color-hover:var(--spectrum-gray-600);--system-spectrum-stepper-border-color-focus:var(--spectrum-gray-800);--system-spectrum-stepper-border-color-focus-hover:var(--spectrum-gray-800);--system-spectrum-stepper-border-color-keyboard-focus:var(--spectrum-gray-900);--system-spectrum-stepper-border-color-invalid:var(--spectrum-negative-border-color-default);--system-spectrum-stepper-border-color-focus-invalid:var(--spectrum-negative-border-color-focus);--system-spectrum-stepper-border-color-focus-hover-invalid:var(--spectrum-negative-border-color-focus-hover);--system-spectrum-stepper-border-color-keyboard-focus-invalid:var(--spectrum-negative-border-color-key-focus);--system-spectrum-stepper-button-background-color-focus:var(--spectrum-gray-300);--system-spectrum-stepper-button-background-color-keyboard-focus:var(--spectrum-gray-200);--system-spectrum-switch-handle-border-color-default:var(--spectrum-gray-600);--system-spectrum-switch-handle-border-color-hover:var(--spectrum-gray-700);--system-spectrum-switch-handle-border-color-down:var(--spectrum-gray-800);--system-spectrum-switch-handle-border-color-focus:var(--spectrum-gray-700);--system-spectrum-switch-handle-border-color-selected-default:var(--spectrum-gray-700);--system-spectrum-switch-handle-border-color-selected-hover:var(--spectrum-gray-800);--system-spectrum-switch-handle-border-color-selected-down:var(--spectrum-gray-900);--system-spectrum-switch-handle-border-color-selected-focus:var(--spectrum-gray-800);--system-spectrum-tabs-font-weight:var(--spectrum-default-font-weight);--system-spectrum-tag-border-color:var(--spectrum-gray-700);--system-spectrum-tag-border-color-hover:var(--spectrum-gray-800);--system-spectrum-tag-border-color-active:var(--spectrum-gray-900);--system-spectrum-tag-border-color-focus:var(--spectrum-gray-800);--system-spectrum-tag-size-small-corner-radius:var(--spectrum-corner-radius-100);--system-spectrum-tag-size-medium-corner-radius:var(--spectrum-corner-radius-100);--system-spectrum-tag-size-large-corner-radius:var(--spectrum-corner-radius-100);--system-spectrum-tag-background-color:var(--spectrum-gray-75);--system-spectrum-tag-background-color-hover:var(--spectrum-gray-75);--system-spectrum-tag-background-color-active:var(--spectrum-gray-200);--system-spectrum-tag-background-color-focus:var(--spectrum-gray-75);--system-spectrum-tag-content-color:var(--spectrum-neutral-subdued-content-color-default);--system-spectrum-tag-content-color-hover:var(--spectrum-neutral-subdued-content-color-hover);--system-spectrum-tag-content-color-active:var(--spectrum-neutral-subdued-content-color-down);--system-spectrum-tag-content-color-focus:var(--spectrum-neutral-subdued-content-color-key-focus);--system-spectrum-tag-border-color-selected:var(--spectrum-neutral-subdued-background-color-default);--system-spectrum-tag-border-color-selected-hover:var(--spectrum-neutral-subdued-background-color-hover);--system-spectrum-tag-border-color-selected-active:var(--spectrum-neutral-subdued-background-color-down);--system-spectrum-tag-border-color-selected-focus:var(--spectrum-neutral-subdued-background-color-key-focus);--system-spectrum-tag-border-color-disabled:transparent;--system-spectrum-tag-background-color-disabled:var(--spectrum-disabled-background-color);--system-spectrum-tag-size-small-spacing-inline-start:var(--spectrum-component-edge-to-visual-75);--system-spectrum-tag-size-small-label-spacing-inline-end:var(--spectrum-component-edge-to-text-75);--system-spectrum-tag-size-small-clear-button-spacing-inline-end:var(--spectrum-component-edge-to-visual-75);--system-spectrum-tag-size-medium-spacing-inline-start:var(--spectrum-component-edge-to-visual-100);--system-spectrum-tag-size-medium-label-spacing-inline-end:var(--spectrum-component-edge-to-text-100);--system-spectrum-tag-size-medium-clear-button-spacing-inline-end:var(--spectrum-component-edge-to-visual-100);--system-spectrum-tag-size-large-spacing-inline-start:var(--spectrum-component-edge-to-visual-200);--system-spectrum-tag-size-large-label-spacing-inline-end:var(--spectrum-component-edge-to-text-200);--system-spectrum-tag-size-large-clear-button-spacing-inline-end:var(--spectrum-component-edge-to-visual-200);--system-spectrum-textfield-border-color:var(--spectrum-gray-500);--system-spectrum-textfield-border-color-hover:var(--spectrum-gray-600);--system-spectrum-textfield-border-color-focus:var(--spectrum-gray-800);--system-spectrum-textfield-border-color-focus-hover:var(--spectrum-gray-900);--system-spectrum-textfield-border-color-keyboard-focus:var(--spectrum-gray-900);--system-spectrum-textfield-border-width:var(--spectrum-border-width-100);--system-spectrum-toast-background-color-default:var(--spectrum-neutral-subdued-background-color-default);--system-spectrum-tooltip-backgound-color-default-neutral:var(--spectrum-neutral-subdued-background-color-default);--system:spectrum;--spectrum-animation-linear:cubic-bezier(0,0,1,1);--spectrum-animation-duration-0:0s;--spectrum-animation-duration-100:.13s;--spectrum-animation-duration-200:.16s;--spectrum-animation-duration-300:.19s;--spectrum-animation-duration-400:.22s;--spectrum-animation-duration-500:.25s;--spectrum-animation-duration-600:.3s;--spectrum-animation-duration-700:.35s;--spectrum-animation-duration-800:.4s;--spectrum-animation-duration-900:.45s;--spectrum-animation-duration-1000:.5s;--spectrum-animation-duration-2000:1s;--spectrum-animation-duration-4000:2s;--spectrum-animation-duration-6000:3s;--spectrum-animation-ease-in-out:cubic-bezier(.45,0,.4,1);--spectrum-animation-ease-in:cubic-bezier(.5,0,1,1);--spectrum-animation-ease-out:cubic-bezier(0,0,.4,1);--spectrum-animation-ease-linear:cubic-bezier(0,0,1,1);--spectrum-sans-font-family-stack:adobe-clean,var(--spectrum-sans-serif-font-family),"Source Sans Pro",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-sans-serif-font:var(--spectrum-sans-font-family-stack);--spectrum-serif-font-family-stack:adobe-clean-serif,var(--spectrum-serif-font-family),"Source Serif Pro",Georgia,serif;--spectrum-serif-font:var(--spectrum-serif-font-family-stack);--spectrum-code-font-family-stack:"Source Code Pro",Monaco,monospace;--spectrum-cjk-font-family-stack:adobe-clean-han-japanese,var(--spectrum-cjk-font-family),sans-serif;--spectrum-cjk-font:var(--spectrum-code-font-family-stack);--spectrum-docs-static-white-background-color-rgb:15,121,125;--spectrum-docs-static-white-background-color:rgba(var(--spectrum-docs-static-white-background-color-rgb));--spectrum-docs-static-black-background-color-rgb:206,247,243;--spectrum-docs-static-black-background-color:rgba(var(--spectrum-docs-static-black-background-color-rgb))}:root,:host{--spectrum-font-family-ar:myriad-arabic,adobe-clean,"Source Sans Pro",-apple-system,blinkmacsystemfont,"Segoe UI",roboto,ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-font-family-he:myriad-hebrew,adobe-clean,"Source Sans Pro",-apple-system,blinkmacsystemfont,"Segoe UI",roboto,ubuntu,"Trebuchet MS","Lucida Grande",sans-serif;--spectrum-font-family:var(--spectrum-sans-font-family-stack);--spectrum-font-style:var(--spectrum-default-font-style);--spectrum-font-size:var(--spectrum-font-size-100);font-family:var(--spectrum-font-family);font-style:var(--spectrum-font-style);font-size:var(--spectrum-font-size)}.spectrum:lang(ar){font-family:var(--spectrum-font-family-ar)}.spectrum:lang(he){font-family:var(--spectrum-font-family-he)}.spectrum-Heading{--spectrum-heading-sans-serif-font-family:var(--spectrum-sans-font-family-stack);--spectrum-heading-serif-font-family:var(--spectrum-serif-font-family-stack);--spectrum-heading-cjk-font-family:var(--spectrum-cjk-font-family-stack);--spectrum-heading-cjk-letter-spacing:var(--spectrum-cjk-letter-spacing);--spectrum-heading-font-color:var(--spectrum-heading-color);--spectrum-heading-margin-start:calc(var(--mod-heading-font-size,var(--spectrum-heading-font-size))*var(--spectrum-heading-margin-top-multiplier));--spectrum-heading-margin-end:calc(var(--mod-heading-font-size,var(--spectrum-heading-font-size))*var(--spectrum-heading-margin-bottom-multiplier))}.spectrum-Heading--sizeXXS{--spectrum-heading-font-size:var(--spectrum-heading-size-xxs);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-xxs)}.spectrum-Heading--sizeXS{--spectrum-heading-font-size:var(--spectrum-heading-size-xs);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-xs)}.spectrum-Heading--sizeS{--spectrum-heading-font-size:var(--spectrum-heading-size-s);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-s)}.spectrum-Heading--sizeM{--spectrum-heading-font-size:var(--spectrum-heading-size-m);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-m)}.spectrum-Heading--sizeL{--spectrum-heading-font-size:var(--spectrum-heading-size-l);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-l)}.spectrum-Heading--sizeXL{--spectrum-heading-font-size:var(--spectrum-heading-size-xl);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-xl)}.spectrum-Heading--sizeXXL{--spectrum-heading-font-size:var(--spectrum-heading-size-xxl);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-xxl)}.spectrum-Heading--sizeXXXL{--spectrum-heading-font-size:var(--spectrum-heading-size-xxxl);--spectrum-heading-cjk-font-size:var(--spectrum-heading-cjk-size-xxxl)}.spectrum-Heading{font-family:var(--mod-heading-sans-serif-font-family,var(--spectrum-heading-sans-serif-font-family));font-style:var(--mod-heading-sans-serif-font-style,var(--spectrum-heading-sans-serif-font-style));font-weight:var(--mod-heading-sans-serif-font-weight,var(--spectrum-heading-sans-serif-font-weight));font-size:var(--mod-heading-font-size,var(--spectrum-heading-font-size));color:var(--highcontrast-heading-font-color,var(--mod-heading-font-color,var(--spectrum-heading-font-color)));line-height:var(--mod-heading-line-height,var(--spectrum-heading-line-height));margin-block:0}.spectrum-Heading .spectrum-Heading-strong,.spectrum-Heading strong{font-style:var(--mod-heading-sans-serif-strong-font-style,var(--spectrum-heading-sans-serif-strong-font-style));font-weight:var(--mod-heading-sans-serif-strong-font-weight,var(--spectrum-heading-sans-serif-strong-font-weight))}.spectrum-Heading .spectrum-Heading-emphasized,.spectrum-Heading em{font-style:var(--mod-heading-sans-serif-emphasized-font-style,var(--spectrum-heading-sans-serif-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-emphasized-font-weight,var(--spectrum-heading-sans-serif-emphasized-font-weight))}.spectrum-Heading .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading em strong,.spectrum-Heading strong em{font-style:var(--mod-heading-sans-serif-strong-emphasized-font-style,var(--spectrum-heading-sans-serif-strong-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-strong-emphasized-font-weight,var(--spectrum-heading-sans-serif-strong-emphasized-font-weight))}.spectrum-Heading:lang(ja),.spectrum-Heading:lang(ko),.spectrum-Heading:lang(zh){font-family:var(--mod-heading-cjk-font-family,var(--spectrum-heading-cjk-font-family));font-style:var(--mod-heading-cjk-font-style,var(--spectrum-heading-cjk-font-style));font-weight:var(--mod-heading-cjk-font-weight,var(--spectrum-heading-cjk-font-weight));font-size:var(--mod-heading-cjk-font-size,var(--spectrum-heading-cjk-font-size));line-height:var(--mod-heading-cjk-line-height,var(--spectrum-heading-cjk-line-height));letter-spacing:var(--mod-heading-cjk-letter-spacing,var(--spectrum-heading-cjk-letter-spacing))}.spectrum-Heading:lang(ja) .spectrum-Heading-emphasized,.spectrum-Heading:lang(ja) em,.spectrum-Heading:lang(ko) .spectrum-Heading-emphasized,.spectrum-Heading:lang(ko) em,.spectrum-Heading:lang(zh) .spectrum-Heading-emphasized,.spectrum-Heading:lang(zh) em{font-style:var(--mod-heading-cjk-emphasized-font-style,var(--spectrum-heading-cjk-emphasized-font-style));font-weight:var(--mod-heading-cjk-emphasized-font-weight,var(--spectrum-heading-cjk-emphasized-font-weight))}.spectrum-Heading:lang(ja) .spectrum-Heading-strong,.spectrum-Heading:lang(ja) strong,.spectrum-Heading:lang(ko) .spectrum-Heading-strong,.spectrum-Heading:lang(ko) strong,.spectrum-Heading:lang(zh) .spectrum-Heading-strong,.spectrum-Heading:lang(zh) strong{font-style:var(--mod-heading-cjk-strong-font-style,var(--spectrum-heading-cjk-strong-font-style));font-weight:var(--mod-heading-cjk-strong-font-weight,var(--spectrum-heading-cjk-strong-font-weight))}.spectrum-Heading:lang(ja) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading:lang(ja) em strong,.spectrum-Heading:lang(ja) strong em,.spectrum-Heading:lang(ko) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading:lang(ko) em strong,.spectrum-Heading:lang(ko) strong em,.spectrum-Heading:lang(zh) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading:lang(zh) em strong,.spectrum-Heading:lang(zh) strong em{font-style:var(--mod-heading-cjk-strong-emphasized-font-style,var(--spectrum-heading-cjk-strong-emphasized-font-style));font-weight:var(--mod-heading-cjk-strong-emphasized-font-weight,var(--spectrum-heading-cjk-strong-emphasized-font-weight))}.spectrum-Heading--heavy{font-style:var(--mod-heading-sans-serif-heavy-font-style,var(--spectrum-heading-sans-serif-heavy-font-style));font-weight:var(--mod-heading-sans-serif-heavy-font-weight,var(--spectrum-heading-sans-serif-heavy-font-weight))}.spectrum-Heading--heavy .spectrum-Heading-strong,.spectrum-Heading--heavy strong{font-style:var(--mod-heading-sans-serif-heavy-strong-font-style,var(--spectrum-heading-sans-serif-heavy-strong-font-style));font-weight:var(--mod-heading-sans-serif-heavy-strong-font-weight,var(--spectrum-heading-sans-serif-heavy-strong-font-weight))}.spectrum-Heading--heavy .spectrum-Heading-emphasized,.spectrum-Heading--heavy em{font-style:var(--mod-heading-sans-serif-heavy-emphasized-font-style,var(--spectrum-heading-sans-serif-heavy-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-heavy-emphasized-font-weight,var(--spectrum-heading-sans-serif-heavy-emphasized-font-weight))}.spectrum-Heading--heavy .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--heavy em strong,.spectrum-Heading--heavy strong em{font-style:var(--mod-heading-sans-serif-heavy-strong-emphasized-font-style,var(--spectrum-heading-sans-serif-heavy-strong-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-heavy-strong-emphasized-font-weight,var(--spectrum-heading-sans-serif-heavy-strong-emphasized-font-weight))}.spectrum-Heading--heavy:lang(ja),.spectrum-Heading--heavy:lang(ko),.spectrum-Heading--heavy:lang(zh){font-style:var(--mod-heading-cjk-heavy-font-style,var(--spectrum-heading-cjk-heavy-font-style));font-weight:var(--mod-heading-cjk-heavy-font-weight,var(--spectrum-heading-cjk-heavy-font-weight))}.spectrum-Heading--heavy:lang(ja) .spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(ja) em,.spectrum-Heading--heavy:lang(ko) .spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(ko) em,.spectrum-Heading--heavy:lang(zh) .spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(zh) em{font-style:var(--mod-heading-cjk-heavy-emphasized-font-style,var(--spectrum-heading-cjk-heavy-emphasized-font-style));font-weight:var(--mod-heading-cjk-heavy-emphasized-font-weight,var(--spectrum-heading-cjk-heavy-emphasized-font-weight))}.spectrum-Heading--heavy:lang(ja) .spectrum-Heading-strong,.spectrum-Heading--heavy:lang(ja) strong,.spectrum-Heading--heavy:lang(ko) .spectrum-Heading-strong,.spectrum-Heading--heavy:lang(ko) strong,.spectrum-Heading--heavy:lang(zh) .spectrum-Heading-strong,.spectrum-Heading--heavy:lang(zh) strong{font-style:var(--mod-heading-cjk-heavy-strong-font-style,var(--spectrum-heading-cjk-heavy-strong-font-style));font-weight:var(--mod-heading-cjk-heavy-strong-font-weight,var(--spectrum-heading-cjk-heavy-strong-font-weight))}.spectrum-Heading--heavy:lang(ja) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(ja) em strong,.spectrum-Heading--heavy:lang(ja) strong em,.spectrum-Heading--heavy:lang(ko) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(ko) em strong,.spectrum-Heading--heavy:lang(ko) strong em,.spectrum-Heading--heavy:lang(zh) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--heavy:lang(zh) em strong,.spectrum-Heading--heavy:lang(zh) strong em{font-style:var(--mod-heading-cjk-heavy-strong-emphasized-font-style,var(--spectrum-heading-cjk-heavy-strong-emphasized-font-style));font-weight:var(--mod-heading-cjk-heavy-strong-emphasized-font-weight,var(--spectrum-heading-cjk-heavy-strong-emphasized-font-weight))}.spectrum-Heading--light{font-style:var(--mod-heading-sans-serif-light-font-style,var(--spectrum-heading-sans-serif-light-font-style));font-weight:var(--mod-heading-sans-serif-light-font-weight,var(--spectrum-heading-sans-serif-light-font-weight))}.spectrum-Heading--light .spectrum-Heading-emphasized,.spectrum-Heading--light em{font-style:var(--mod-heading-sans-serif-light-emphasized-font-style,var(--spectrum-heading-sans-serif-light-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-light-emphasized-font-weight,var(--spectrum-heading-sans-serif-light-emphasized-font-weight))}.spectrum-Heading--light .spectrum-Heading-strong,.spectrum-Heading--light strong{font-style:var(--mod-heading-sans-serif-light-strong-font-style,var(--spectrum-heading-sans-serif-light-strong-font-style));font-weight:var(--mod-heading-sans-serif-light-strong-font-weight,var(--spectrum-heading-sans-serif-light-strong-font-weight))}.spectrum-Heading--light .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--light em strong,.spectrum-Heading--light strong em{font-style:var(--mod-heading-sans-serif-light-strong-emphasized-font-style,var(--spectrum-heading-sans-serif-light-strong-emphasized-font-style));font-weight:var(--mod-heading-sans-serif-light-strong-emphasized-font-weight,var(--spectrum-heading-sans-serif-light-strong-emphasized-font-weight))}.spectrum-Heading--light:lang(ja),.spectrum-Heading--light:lang(ko),.spectrum-Heading--light:lang(zh){font-style:var(--mod-heading-cjk-light-font-style,var(--spectrum-heading-cjk-light-font-style));font-weight:var(--mod-heading-cjk-light-font-weight,var(--spectrum-heading-cjk-light-font-weight))}.spectrum-Heading--light:lang(ja) .spectrum-Heading-strong,.spectrum-Heading--light:lang(ja) strong,.spectrum-Heading--light:lang(ko) .spectrum-Heading-strong,.spectrum-Heading--light:lang(ko) strong,.spectrum-Heading--light:lang(zh) .spectrum-Heading-strong,.spectrum-Heading--light:lang(zh) strong{font-style:var(--mod-heading-cjk-light-strong-font-style,var(--spectrum-heading-cjk-light-strong-font-style));font-weight:var(--mod-heading-cjk-light-strong-font-weight,var(--spectrum-heading-cjk-light-strong-font-weight))}.spectrum-Heading--light:lang(ja) .spectrum-Heading-emphasized,.spectrum-Heading--light:lang(ja) em,.spectrum-Heading--light:lang(ko) .spectrum-Heading-emphasized,.spectrum-Heading--light:lang(ko) em,.spectrum-Heading--light:lang(zh) .spectrum-Heading-emphasized,.spectrum-Heading--light:lang(zh) em{font-style:var(--mod-heading-cjk-light-emphasized-font-style,var(--spectrum-heading-cjk-light-emphasized-font-style));font-weight:var(--mod-heading-cjk-light-emphasized-font-weight,var(--spectrum-heading-cjk-light-emphasized-font-weight))}.spectrum-Heading--light:lang(ja) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--light:lang(ja) em strong,.spectrum-Heading--light:lang(ja) strong em,.spectrum-Heading--light:lang(ko) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--light:lang(ko) em strong,.spectrum-Heading--light:lang(ko) strong em,.spectrum-Heading--light:lang(zh) .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--light:lang(zh) em strong,.spectrum-Heading--light:lang(zh) strong em{font-style:var(--mod-heading-cjk-light-strong-emphasized-font-style,var(--spectrum-heading-cjk-light-strong-emphasized-font-style));font-weight:var(--mod-heading-cjk-light-strong-emphasized-font-weight,var(--spectrum-heading-cjk-light-strong-emphasized-font-weight))}.spectrum-Heading--serif{font-family:var(--mod-heading-serif-font-family,var(--spectrum-heading-serif-font-family));font-style:var(--mod-heading-serif-font-style,var(--spectrum-heading-serif-font-style));font-weight:var(--mod-heading-serif-font-weight,var(--spectrum-heading-serif-font-weight))}.spectrum-Heading--serif .spectrum-Heading-emphasized,.spectrum-Heading--serif em{font-style:var(--mod-heading-serif-emphasized-font-style,var(--spectrum-heading-serif-emphasized-font-style));font-weight:var(--mod-heading-serif-emphasized-font-weight,var(--spectrum-heading-serif-emphasized-font-weight))}.spectrum-Heading--serif .spectrum-Heading-strong,.spectrum-Heading--serif strong{font-style:var(--mod-heading-serif-strong-font-style,var(--spectrum-heading-serif-strong-font-style));font-weight:var(--mod-heading-serif-strong-font-weight,var(--spectrum-heading-serif-strong-font-weight))}.spectrum-Heading--serif .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--serif em strong,.spectrum-Heading--serif strong em{font-style:var(--mod-heading-serif-strong-emphasized-font-style,var(--spectrum-heading-serif-strong-emphasized-font-style));font-weight:var(--mod-heading-serif-strong-emphasized-font-weight,var(--spectrum-heading-serif-strong-emphasized-font-weight))}.spectrum-Heading--serif.spectrum-Heading--heavy{font-style:var(--mod-heading-serif-heavy-font-style,var(--spectrum-heading-serif-heavy-font-style));font-weight:var(--mod-heading-serif-heavy-font-weight,var(--spectrum-heading-serif-heavy-font-weight))}.spectrum-Heading--serif.spectrum-Heading--heavy .spectrum-Heading-strong,.spectrum-Heading--serif.spectrum-Heading--heavy strong{font-style:var(--mod-heading-serif-heavy-strong-font-style,var(--spectrum-heading-serif-heavy-strong-font-style));font-weight:var(--mod-heading-serif-heavy-strong-font-weight,var(--spectrum-heading-serif-heavy-strong-font-weight))}.spectrum-Heading--serif.spectrum-Heading--heavy .spectrum-Heading-emphasized,.spectrum-Heading--serif.spectrum-Heading--heavy em{font-style:var(--mod-heading-serif-heavy-emphasized-font-style,var(--spectrum-heading-serif-heavy-emphasized-font-style));font-weight:var(--mod-heading-serif-heavy-emphasized-font-weight,var(--spectrum-heading-serif-heavy-emphasized-font-weight))}.spectrum-Heading--serif.spectrum-Heading--heavy .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--serif.spectrum-Heading--heavy em strong,.spectrum-Heading--serif.spectrum-Heading--heavy strong em{font-style:var(--mod-heading-serif-heavy-strong-emphasized-font-style,var(--spectrum-heading-serif-heavy-strong-emphasized-font-style));font-weight:var(--mod-heading-serif-heavy-strong-emphasized-font-weight,var(--spectrum-heading-serif-heavy-strong-emphasized-font-weight))}.spectrum-Heading--serif.spectrum-Heading--light{font-style:var(--mod-heading-serif-light-font-style,var(--spectrum-heading-serif-light-font-style));font-weight:var(--mod-heading-serif-light-font-weight,var(--spectrum-heading-serif-light-font-weight))}.spectrum-Heading--serif.spectrum-Heading--light .spectrum-Heading-emphasized,.spectrum-Heading--serif.spectrum-Heading--light em{font-style:var(--mod-heading-serif-light-emphasized-font-style,var(--spectrum-heading-serif-light-emphasized-font-style));font-weight:var(--mod-heading-serif-light-emphasized-font-weight,var(--spectrum-heading-serif-light-emphasized-font-weight))}.spectrum-Heading--serif.spectrum-Heading--light .spectrum-Heading-strong,.spectrum-Heading--serif.spectrum-Heading--light strong{font-style:var(--mod-heading-serif-light-strong-font-style,var(--spectrum-heading-serif-light-strong-font-style));font-weight:var(--mod-heading-serif-light-strong-font-weight,var(--spectrum-heading-serif-light-strong-font-weight))}.spectrum-Heading--serif.spectrum-Heading--light .spectrum-Heading-strong.spectrum-Heading-emphasized,.spectrum-Heading--serif.spectrum-Heading--light em strong,.spectrum-Heading--serif.spectrum-Heading--light strong em{font-style:var(--mod-heading-serif-light-strong-emphasized-font-style,var(--spectrum-heading-serif-light-strong-emphasized-font-style));font-weight:var(--mod-heading-serif-light-strong-emphasized-font-weight,var(--spectrum-heading-serif-light-strong-emphasized-font-weight))}.spectrum-Typography .spectrum-Heading{margin-block-start:var(--mod-heading-margin-start,var(--spectrum-heading-margin-start));margin-block-end:var(--mod-heading-margin-end,var(--spectrum-heading-margin-end))}.spectrum-Body{--spectrum-body-sans-serif-font-family:var(--spectrum-sans-font-family-stack);--spectrum-body-serif-font-family:var(--spectrum-serif-font-family-stack);--spectrum-body-cjk-font-family:var(--spectrum-cjk-font-family-stack);--spectrum-body-cjk-letter-spacing:var(--spectrum-cjk-letter-spacing);--spectrum-body-margin:calc(var(--mod-body-font-size,var(--spectrum-body-font-size))*var(--spectrum-body-margin-multiplier));--spectrum-body-font-color:var(--spectrum-body-color)}.spectrum-Body--sizeXS{--spectrum-body-font-size:var(--spectrum-body-size-xs)}.spectrum-Body--sizeS{--spectrum-body-font-size:var(--spectrum-body-size-s)}.spectrum-Body--sizeM{--spectrum-body-font-size:var(--spectrum-body-size-m)}.spectrum-Body--sizeL{--spectrum-body-font-size:var(--spectrum-body-size-l)}.spectrum-Body--sizeXL{--spectrum-body-font-size:var(--spectrum-body-size-xl)}.spectrum-Body--sizeXXL{--spectrum-body-font-size:var(--spectrum-body-size-xxl)}.spectrum-Body--sizeXXXL{--spectrum-body-font-size:var(--spectrum-body-size-xxxl)}.spectrum-Body{font-family:var(--mod-body-sans-serif-font-family,var(--spectrum-body-sans-serif-font-family));font-style:var(--mod-body-sans-serif-font-style,var(--spectrum-body-sans-serif-font-style));font-weight:var(--mod-body-sans-serif-font-weight,var(--spectrum-body-sans-serif-font-weight));font-size:var(--mod-body-font-size,var(--spectrum-body-font-size));color:var(--highcontrast-body-font-color,var(--mod-body-font-color,var(--spectrum-body-font-color)));line-height:var(--mod-body-line-height,var(--spectrum-body-line-height));margin-block:0}.spectrum-Body .spectrum-Body-strong,.spectrum-Body strong{font-style:var(--mod-body-sans-serif-strong-font-style,var(--spectrum-body-sans-serif-strong-font-style));font-weight:var(--mod-body-sans-serif-strong-font-weight,var(--spectrum-body-sans-serif-strong-font-weight))}.spectrum-Body .spectrum-Body-emphasized,.spectrum-Body em{font-style:var(--mod-body-sans-serif-emphasized-font-style,var(--spectrum-body-sans-serif-emphasized-font-style));font-weight:var(--mod-body-sans-serif-emphasized-font-weight,var(--spectrum-body-sans-serif-emphasized-font-weight))}.spectrum-Body .spectrum-Body-strong.spectrum-Body-emphasized,.spectrum-Body em strong,.spectrum-Body strong em{font-style:var(--mod-body-sans-serif-strong-emphasized-font-style,var(--spectrum-body-sans-serif-strong-emphasized-font-style));font-weight:var(--mod-body-sans-serif-strong-emphasized-font-weight,var(--spectrum-body-sans-serif-strong-emphasized-font-weight))}.spectrum-Body:lang(ja),.spectrum-Body:lang(ko),.spectrum-Body:lang(zh){font-family:var(--mod-body-cjk-font-family,var(--spectrum-body-cjk-font-family));font-style:var(--mod-body-cjk-font-style,var(--spectrum-body-cjk-font-style));font-weight:var(--mod-body-cjk-font-weight,var(--spectrum-body-cjk-font-weight));line-height:var(--mod-body-cjk-line-height,var(--spectrum-body-cjk-line-height));letter-spacing:var(--mod-body-cjk-letter-spacing,var(--spectrum-body-cjk-letter-spacing))}.spectrum-Body:lang(ja) .spectrum-Body-strong,.spectrum-Body:lang(ja) strong,.spectrum-Body:lang(ko) .spectrum-Body-strong,.spectrum-Body:lang(ko) strong,.spectrum-Body:lang(zh) .spectrum-Body-strong,.spectrum-Body:lang(zh) strong{font-style:var(--mod-body-cjk-strong-font-style,var(--spectrum-body-cjk-strong-font-style));font-weight:var(--mod-body-cjk-strong-font-weight,var(--spectrum-body-cjk-strong-font-weight))}.spectrum-Body:lang(ja) .spectrum-Body-emphasized,.spectrum-Body:lang(ja) em,.spectrum-Body:lang(ko) .spectrum-Body-emphasized,.spectrum-Body:lang(ko) em,.spectrum-Body:lang(zh) .spectrum-Body-emphasized,.spectrum-Body:lang(zh) em{font-style:var(--mod-body-cjk-emphasized-font-style,var(--spectrum-body-cjk-emphasized-font-style));font-weight:var(--mod-body-cjk-emphasized-font-weight,var(--spectrum-body-cjk-emphasized-font-weight))}.spectrum-Body:lang(ja) .spectrum-Body-strong.spectrum-Body-emphasized,.spectrum-Body:lang(ja) em strong,.spectrum-Body:lang(ja) strong em,.spectrum-Body:lang(ko) .spectrum-Body-strong.spectrum-Body-emphasized,.spectrum-Body:lang(ko) em strong,.spectrum-Body:lang(ko) strong em,.spectrum-Body:lang(zh) .spectrum-Body-strong.spectrum-Body-emphasized,.spectrum-Body:lang(zh) em strong,.spectrum-Body:lang(zh) strong em{font-style:var(--mod-body-cjk-strong-emphasized-font-style,var(--spectrum-body-cjk-strong-emphasized-font-style));font-weight:var(--mod-body-cjk-strong-emphasized-font-weight,var(--spectrum-body-cjk-strong-emphasized-font-weight))}.spectrum-Body--serif{font-family:var(--mod-body-serif-font-family,var(--spectrum-body-serif-font-family));font-weight:var(--mod-body-serif-font-weight,var(--spectrum-body-serif-font-weight));font-style:var(--mod-body-serif-font-style,var(--spectrum-body-serif-font-style))}.spectrum-Body--serif .spectrum-Body-strong,.spectrum-Body--serif strong{font-style:var(--mod-body-serif-strong-font-style,var(--spectrum-body-serif-strong-font-style));font-weight:var(--mod-body-serif-strong-font-weight,var(--spectrum-body-serif-strong-font-weight))}.spectrum-Body--serif .spectrum-Body-emphasized,.spectrum-Body--serif em{font-style:var(--mod-body-serif-emphasized-font-style,var(--spectrum-body-serif-emphasized-font-style));font-weight:var(--mod-body-serif-emphasized-font-weight,var(--spectrum-body-serif-emphasized-font-weight))}.spectrum-Body--serif .spectrum-Body-strong.spectrum-Body-emphasized,.spectrum-Body--serif em strong,.spectrum-Body--serif strong em{font-style:var(--mod-body-serif-strong-emphasized-font-style,var(--spectrum-body-serif-strong-emphasized-font-style));font-weight:var(--mod-body-serif-strong-emphasized-font-weight,var(--spectrum-body-serif-strong-emphasized-font-weight))}.spectrum-Typography .spectrum-Body{margin-block-end:var(--mod-body-margin,var(--spectrum-body-margin))}.spectrum-Detail{--spectrum-detail-sans-serif-font-family:var(--spectrum-sans-font-family-stack);--spectrum-detail-serif-font-family:var(--spectrum-serif-font-family-stack);--spectrum-detail-cjk-font-family:var(--spectrum-cjk-font-family-stack);--spectrum-detail-margin-start:calc(var(--mod-detail-font-size,var(--spectrum-detail-font-size))*var(--spectrum-detail-margin-top-multiplier));--spectrum-detail-margin-end:calc(var(--mod-detail-font-size,var(--spectrum-detail-font-size))*var(--spectrum-detail-margin-bottom-multiplier));--spectrum-detail-font-color:var(--spectrum-detail-color)}.spectrum-Detail--sizeS{--spectrum-detail-font-size:var(--spectrum-detail-size-s)}.spectrum-Detail--sizeM{--spectrum-detail-font-size:var(--spectrum-detail-size-m)}.spectrum-Detail--sizeL{--spectrum-detail-font-size:var(--spectrum-detail-size-l)}.spectrum-Detail--sizeXL{--spectrum-detail-font-size:var(--spectrum-detail-size-xl)}.spectrum-Detail{font-family:var(--mod-detail-sans-serif-font-family,var(--spectrum-detail-sans-serif-font-family));font-style:var(--mod-detail-sans-serif-font-style,var(--spectrum-detail-sans-serif-font-style));font-weight:var(--mod-detail-sans-serif-font-weight,var(--spectrum-detail-sans-serif-font-weight));font-size:var(--mod-detail-font-size,var(--spectrum-detail-font-size));color:var(--highcontrast-detail-font-color,var(--mod-detail-font-color,var(--spectrum-detail-font-color)));line-height:var(--mod-detail-line-height,var(--spectrum-detail-line-height));letter-spacing:var(--mod-detail-letter-spacing,var(--spectrum-detail-letter-spacing));text-transform:uppercase;margin-block:0}.spectrum-Detail .spectrum-Detail-strong,.spectrum-Detail strong{font-style:var(--mod-detail-sans-serif-strong-font-style,var(--spectrum-detail-sans-serif-strong-font-style));font-weight:var(--mod-detail-sans-serif-strong-font-weight,var(--spectrum-detail-sans-serif-strong-font-weight))}.spectrum-Detail .spectrum-Detail-emphasized,.spectrum-Detail em{font-style:var(--mod-detail-sans-serif-emphasized-font-style,var(--spectrum-detail-sans-serif-emphasized-font-style));font-weight:var(--mod-detail-sans-serif-emphasized-font-weight,var(--spectrum-detail-sans-serif-emphasized-font-weight))}.spectrum-Detail .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail em strong,.spectrum-Detail strong em{font-style:var(--mod-detail-sans-serif-strong-emphasized-font-style,var(--spectrum-detail-sans-serif-strong-emphasized-font-style));font-weight:var(--mod-detail-sans-serif-strong-emphasized-font-weight,var(--spectrum-detail-sans-serif-strong-emphasized-font-weight))}.spectrum-Detail:lang(ja),.spectrum-Detail:lang(ko),.spectrum-Detail:lang(zh){font-family:var(--mod-detail-cjk-font-family,var(--spectrum-detail-cjk-font-family));font-style:var(--mod-detail-cjk-font-style,var(--spectrum-detail-cjk-font-style));font-weight:var(--mod-detail-cjk-font-weight,var(--spectrum-detail-cjk-font-weight));line-height:var(--mod-detail-cjk-line-height,var(--spectrum-detail-cjk-line-height))}.spectrum-Detail:lang(ja) .spectrum-Detail-strong,.spectrum-Detail:lang(ja) strong,.spectrum-Detail:lang(ko) .spectrum-Detail-strong,.spectrum-Detail:lang(ko) strong,.spectrum-Detail:lang(zh) .spectrum-Detail-strong,.spectrum-Detail:lang(zh) strong{font-style:var(--mod-detail-cjk-strong-font-style,var(--spectrum-detail-cjk-strong-font-style));font-weight:var(--mod-detail-cjk-strong-font-weight,var(--spectrum-detail-cjk-strong-font-weight))}.spectrum-Detail:lang(ja) .spectrum-Detail-emphasized,.spectrum-Detail:lang(ja) em,.spectrum-Detail:lang(ko) .spectrum-Detail-emphasized,.spectrum-Detail:lang(ko) em,.spectrum-Detail:lang(zh) .spectrum-Detail-emphasized,.spectrum-Detail:lang(zh) em{font-style:var(--mod-detail-cjk-emphasized-font-style,var(--spectrum-detail-cjk-emphasized-font-style));font-weight:var(--mod-detail-cjk-emphasized-font-weight,var(--spectrum-detail-cjk-emphasized-font-weight))}.spectrum-Detail:lang(ja) .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail:lang(ja) em strong,.spectrum-Detail:lang(ja) strong em,.spectrum-Detail:lang(ko) .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail:lang(ko) em strong,.spectrum-Detail:lang(ko) strong em,.spectrum-Detail:lang(zh) .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail:lang(zh) em strong,.spectrum-Detail:lang(zh) strong em{font-style:var(--mod-detail-cjk-strong-emphasized-font-style,var(--spectrum-detail-cjk-strong-emphasized-font-style));font-weight:var(--mod-detail-cjk-strong-emphasized-font-weight,var(--spectrum-detail-cjk-strong-emphasized-font-weight))}.spectrum-Detail--serif{font-family:var(--mod-detail-serif-font-family,var(--spectrum-detail-serif-font-family));font-style:var(--mod-detail-serif-font-style,var(--spectrum-detail-serif-font-style));font-weight:var(--mod-detail-serif-font-weight,var(--spectrum-detail-serif-font-weight))}.spectrum-Detail--serif .spectrum-Detail-strong,.spectrum-Detail--serif strong{font-style:var(--mod-detail-serif-strong-font-style,var(--spectrum-detail-serif-strong-font-style));font-weight:var(--mod-detail-serif-strong-font-weight,var(--spectrum-detail-serif-strong-font-weight))}.spectrum-Detail--serif .spectrum-Detail-emphasized,.spectrum-Detail--serif em{font-style:var(--mod-detail-serif-emphasized-font-style,var(--spectrum-detail-serif-emphasized-font-style));font-weight:var(--mod-detail-serif-emphasized-font-weight,var(--spectrum-detail-serif-emphasized-font-weight))}.spectrum-Detail--serif .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail--serif em strong,.spectrum-Detail--serif strong em{font-style:var(--mod-detail-serif-strong-emphasized-font-style,var(--spectrum-detail-serif-strong-emphasized-font-style));font-weight:var(--mod-detail-serif-strong-emphasized-font-weight,var(--spectrum-detail-serif-strong-emphasized-font-weight))}.spectrum-Detail--light{font-style:var(--mod-detail-sans-serif-light-font-style,var(--spectrum-detail-sans-serif-light-font-style));font-weight:var(--spectrum-detail-sans-serif-light-font-weight,var(--spectrum-detail-sans-serif-light-font-weight))}.spectrum-Detail--light .spectrum-Detail-strong,.spectrum-Detail--light strong{font-style:var(--mod-detail-sans-serif-light-strong-font-style,var(--spectrum-detail-sans-serif-light-strong-font-style));font-weight:var(--mod-detail-sans-serif-light-strong-font-weight,var(--spectrum-detail-sans-serif-light-strong-font-weight))}.spectrum-Detail--light .spectrum-Detail-emphasized,.spectrum-Detail--light em{font-style:var(--mod-detail-sans-serif-light-emphasized-font-style,var(--spectrum-detail-sans-serif-light-emphasized-font-style));font-weight:var(--mod-detail-sans-serif-light-emphasized-font-weight,var(--spectrum-detail-sans-serif-light-emphasized-font-weight))}.spectrum-Detail--light .spectrum-Detail-strong.spectrum-Body-emphasized,.spectrum-Detail--light em strong,.spectrum-Detail--light strong em{font-style:var(--mod-detail-sans-serif-light-strong-emphasized-font-style,var(--spectrum-detail-sans-serif-light-strong-emphasized-font-style));font-weight:var(--mod-detail-sans-serif-light-strong-emphasized-font-weight,var(--spectrum-detail-sans-serif-light-strong-emphasized-font-weight))}.spectrum-Detail--light:lang(ja),.spectrum-Detail--light:lang(ko),.spectrum-Detail--light:lang(zh){font-style:var(--mod-detail-cjk-light-font-style,var(--spectrum-detail-cjk-light-font-style));font-weight:var(--mod-detail-cjk-light-font-weight,var(--spectrum-detail-cjk-light-font-weight))}.spectrum-Detail--light:lang(ja) .spectrum-Detail-strong,.spectrum-Detail--light:lang(ja) strong,.spectrum-Detail--light:lang(ko) .spectrum-Detail-strong,.spectrum-Detail--light:lang(ko) strong,.spectrum-Detail--light:lang(zh) .spectrum-Detail-strong,.spectrum-Detail--light:lang(zh) strong{font-style:var(--mod-detail-cjk-light-strong-font-style,var(--spectrum-detail-cjk-light-strong-font-style));font-weight:var(--mod-detail-cjk-light-strong-font-weight,var(--spectrum-detail-cjk-light-strong-font-weight))}.spectrum-Detail--light:lang(ja) .spectrum-Detail-emphasized,.spectrum-Detail--light:lang(ja) em,.spectrum-Detail--light:lang(ko) .spectrum-Detail-emphasized,.spectrum-Detail--light:lang(ko) em,.spectrum-Detail--light:lang(zh) .spectrum-Detail-emphasized,.spectrum-Detail--light:lang(zh) em{font-style:var(--mod-detail-cjk-light-emphasized-font-style,var(--spectrum-detail-cjk-light-emphasized-font-style));font-weight:var(--mod-detail-cjk-light-emphasized-font-weight,var(--spectrum-detail-cjk-light-emphasized-font-weight))}.spectrum-Detail--light:lang(ja) .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail--light:lang(ko) .spectrum-Detail-strong.spectrum-Detail-emphasized,.spectrum-Detail--light:lang(zh) .spectrum-Detail-strong.spectrum-Detail-emphasized{font-style:var(--mod-detail-cjk-light-strong-emphasized-font-style,var(--spectrum-detail-cjk-light-strong-emphasized-font-style));font-weight:var(--mod-detail-cjk-light-strong-emphasized-font-weight,var(--spectrum-detail-cjk-light-strong-emphasized-font-weight))}.spectrum-Detail--serif.spectrum-Detail--light{font-style:var(--mod-detail-serif-light-font-style,var(--spectrum-detail-serif-light-font-style));font-weight:var(--mod-detail-serif-light-font-weight,var(--spectrum-detail-serif-light-font-weight))}.spectrum-Detail--serif.spectrum-Detail--light .spectrum-Detail-strong,.spectrum-Detail--serif.spectrum-Detail--light strong{font-style:var(--mod-detail-serif-light-strong-font-style,var(--spectrum-detail-serif-light-strong-font-style));font-weight:var(--mod-detail-serif-light-strong-font-weight,var(--spectrum-detail-serif-light-strong-font-weight))}.spectrum-Detail--serif.spectrum-Detail--light .spectrum-Detail-emphasized,.spectrum-Detail--serif.spectrum-Detail--light em{font-style:var(--mod-detail-serif-light-emphasized-font-style,var(--spectrum-detail-serif-light-emphasized-font-style));font-weight:var(--mod-detail-serif-light-emphasized-font-weight,var(--spectrum-detail-serif-light-emphasized-font-weight))}.spectrum-Detail--serif.spectrum-Detail--light .spectrum-Detail-strong.spectrum-Body-emphasized,.spectrum-Detail--serif.spectrum-Detail--light em strong,.spectrum-Detail--serif.spectrum-Detail--light strong em{font-style:var(--mod-detail-serif-light-strong-emphasized-font-style,var(--spectrum-detail-serif-light-strong-emphasized-font-style));font-weight:var(--mod-detail-serif-light-strong-emphasized-font-weight,var(--spectrum-detail-serif-light-strong-emphasized-font-weight))}.spectrum-Typography .spectrum-Detail{margin-block-start:var(--mod-detail-margin-start,var(--spectrum-detail-margin-start));margin-block-end:var(--mod-detail-margin-end,var(--spectrum-detail-margin-end))}.spectrum-Code{--spectrum-code-font-family:var(--spectrum-code-font-family-stack);--spectrum-code-cjk-letter-spacing:var(--spectrum-cjk-letter-spacing);--spectrum-code-font-color:var(--spectrum-code-color)}.spectrum-Code--sizeXS{--spectrum-code-font-size:var(--spectrum-code-size-xs)}.spectrum-Code--sizeS{--spectrum-code-font-size:var(--spectrum-code-size-s)}.spectrum-Code--sizeM{--spectrum-code-font-size:var(--spectrum-code-size-m)}.spectrum-Code--sizeL{--spectrum-code-font-size:var(--spectrum-code-size-l)}.spectrum-Code--sizeXL{--spectrum-code-font-size:var(--spectrum-code-size-xl)}.spectrum-Code{font-family:var(--mod-code-font-family,var(--spectrum-code-font-family));font-style:var(--mod-code-font-style,var(--spectrum-code-font-style));font-weight:var(--mod-code-font-weight,var(--spectrum-code-font-weight));font-size:var(--mod-code-font-size,var(--spectrum-code-font-size));line-height:var(--mod-code-line-height,var(--spectrum-code-line-height));color:var(--highcontrast-code-font-color,var(--mod-code-font-color,var(--spectrum-code-font-color)));margin-block:0}.spectrum-Code .spectrum-Code-strong,.spectrum-Code strong{font-style:var(--mod-code-strong-font-style,var(--spectrum-code-strong-font-style));font-weight:var(--mod-code-strong-font-weight,var(--spectrum-code-strong-font-weight))}.spectrum-Code .spectrum-Code-emphasized,.spectrum-Code em{font-style:var(--mod-code-emphasized-font-style,var(--spectrum-code-emphasized-font-style));font-weight:var(--mod-code-emphasized-font-weight,var(--spectrum-code-emphasized-font-weight))}.spectrum-Code .spectrum-Code-strong.spectrum-Code-emphasized,.spectrum-Code em strong,.spectrum-Code strong em{font-style:var(--mod-code-strong-emphasized-font-style,var(--spectrum-code-strong-emphasized-font-style));font-weight:var(--mod-code-strong-emphasized-font-weight,var(--spectrum-code-strong-emphasized-font-weight))}.spectrum-Code:lang(ja),.spectrum-Code:lang(ko),.spectrum-Code:lang(zh){font-family:var(--mod-code-cjk-font-family,var(--spectrum-code-cjk-font-family));font-style:var(--mod-code-cjk-font-style,var(--spectrum-code-cjk-font-style));font-weight:var(--mod-code-cjk-font-weight,var(--spectrum-code-cjk-font-weight));line-height:var(--mod-code-cjk-line-height,var(--spectrum-code-cjk-line-height));letter-spacing:var(--mod-code-cjk-letter-spacing,var(--spectrum-code-cjk-letter-spacing))}.spectrum-Code:lang(ja) .spectrum-Code-strong,.spectrum-Code:lang(ja) strong,.spectrum-Code:lang(ko) .spectrum-Code-strong,.spectrum-Code:lang(ko) strong,.spectrum-Code:lang(zh) .spectrum-Code-strong,.spectrum-Code:lang(zh) strong{font-style:var(--mod-code-cjk-strong-font-style,var(--spectrum-code-cjk-strong-font-style));font-weight:var(--mod-code-cjk-strong-font-weight,var(--spectrum-code-cjk-strong-font-weight))}.spectrum-Code:lang(ja) .spectrum-Code-emphasized,.spectrum-Code:lang(ja) em,.spectrum-Code:lang(ko) .spectrum-Code-emphasized,.spectrum-Code:lang(ko) em,.spectrum-Code:lang(zh) .spectrum-Code-emphasized,.spectrum-Code:lang(zh) em{font-style:var(--mod-code-cjk-emphasized-font-style,var(--spectrum-code-cjk-emphasized-font-style));font-weight:var(--mod-code-cjk-emphasized-font-weight,var(--spectrum-code-cjk-emphasized-font-weight))}.spectrum-Code:lang(ja) .spectrum-Code-strong.spectrum-Code-emphasized,.spectrum-Code:lang(ja) em strong,.spectrum-Code:lang(ja) strong em,.spectrum-Code:lang(ko) .spectrum-Code-strong.spectrum-Code-emphasized,.spectrum-Code:lang(ko) em strong,.spectrum-Code:lang(ko) strong em,.spectrum-Code:lang(zh) .spectrum-Code-strong.spectrum-Code-emphasized,.spectrum-Code:lang(zh) em strong,.spectrum-Code:lang(zh) strong em{font-style:var(--mod-code-cjk-strong-emphasized-font-style,var(--spectrum-code-cjk-strong-emphasized-font-style));font-weight:var(--mod-code-cjk-strong-emphasized-font-weight,var(--spectrum-code-cjk-strong-emphasized-font-weight))}:host{display:block}#scale,#theme{width:100%;height:100%}
        `;
var theme_css_default = e20;

// ../node_modules/@spectrum-web-components/theme/core.js
Theme.registerThemeFragment("spectrum", "system", theme_css_default);

// ../node_modules/@spectrum-web-components/theme/scale-medium.js
Theme.registerThemeFragment("medium", "scale", scale_medium_css_default);

// ../node_modules/@spectrum-web-components/theme/sp-theme.js
customElements.define("sp-theme", Theme);

// ../node_modules/@spectrum-web-components/theme/src/theme-light.css.js
init_src();
var e21 = i3`
    :root,:host{--spectrum-global-color-status:Verified;--spectrum-global-color-version:5.1;--spectrum-global-color-opacity-100:1;--spectrum-global-color-opacity-90:.9;--spectrum-global-color-opacity-80:.8;--spectrum-global-color-opacity-70:.7;--spectrum-global-color-opacity-60:.6;--spectrum-global-color-opacity-55:.55;--spectrum-global-color-opacity-50:.5;--spectrum-global-color-opacity-42:.42;--spectrum-global-color-opacity-40:.4;--spectrum-global-color-opacity-30:.3;--spectrum-global-color-opacity-25:.25;--spectrum-global-color-opacity-20:.2;--spectrum-global-color-opacity-15:.15;--spectrum-global-color-opacity-10:.1;--spectrum-global-color-opacity-8:.08;--spectrum-global-color-opacity-7:.07;--spectrum-global-color-opacity-6:.06;--spectrum-global-color-opacity-5:.05;--spectrum-global-color-opacity-4:.04;--spectrum-global-color-opacity-0:0;--spectrum-global-color-celery-400-rgb:39,187,54;--spectrum-global-color-celery-400:rgb(var(--spectrum-global-color-celery-400-rgb));--spectrum-global-color-celery-500-rgb:7,167,33;--spectrum-global-color-celery-500:rgb(var(--spectrum-global-color-celery-500-rgb));--spectrum-global-color-celery-600-rgb:0,145,18;--spectrum-global-color-celery-600:rgb(var(--spectrum-global-color-celery-600-rgb));--spectrum-global-color-celery-700-rgb:0,124,15;--spectrum-global-color-celery-700:rgb(var(--spectrum-global-color-celery-700-rgb));--spectrum-global-color-chartreuse-400-rgb:152,197,10;--spectrum-global-color-chartreuse-400:rgb(var(--spectrum-global-color-chartreuse-400-rgb));--spectrum-global-color-chartreuse-500-rgb:135,177,3;--spectrum-global-color-chartreuse-500:rgb(var(--spectrum-global-color-chartreuse-500-rgb));--spectrum-global-color-chartreuse-600-rgb:118,156,0;--spectrum-global-color-chartreuse-600:rgb(var(--spectrum-global-color-chartreuse-600-rgb));--spectrum-global-color-chartreuse-700-rgb:103,136,0;--spectrum-global-color-chartreuse-700:rgb(var(--spectrum-global-color-chartreuse-700-rgb));--spectrum-global-color-yellow-400-rgb:232,198,0;--spectrum-global-color-yellow-400:rgb(var(--spectrum-global-color-yellow-400-rgb));--spectrum-global-color-yellow-500-rgb:215,179,0;--spectrum-global-color-yellow-500:rgb(var(--spectrum-global-color-yellow-500-rgb));--spectrum-global-color-yellow-600-rgb:196,159,0;--spectrum-global-color-yellow-600:rgb(var(--spectrum-global-color-yellow-600-rgb));--spectrum-global-color-yellow-700-rgb:176,140,0;--spectrum-global-color-yellow-700:rgb(var(--spectrum-global-color-yellow-700-rgb));--spectrum-global-color-magenta-400-rgb:222,61,130;--spectrum-global-color-magenta-400:rgb(var(--spectrum-global-color-magenta-400-rgb));--spectrum-global-color-magenta-500-rgb:200,34,105;--spectrum-global-color-magenta-500:rgb(var(--spectrum-global-color-magenta-500-rgb));--spectrum-global-color-magenta-600-rgb:173,9,85;--spectrum-global-color-magenta-600:rgb(var(--spectrum-global-color-magenta-600-rgb));--spectrum-global-color-magenta-700-rgb:142,0,69;--spectrum-global-color-magenta-700:rgb(var(--spectrum-global-color-magenta-700-rgb));--spectrum-global-color-fuchsia-400-rgb:205,58,206;--spectrum-global-color-fuchsia-400:rgb(var(--spectrum-global-color-fuchsia-400-rgb));--spectrum-global-color-fuchsia-500-rgb:182,34,183;--spectrum-global-color-fuchsia-500:rgb(var(--spectrum-global-color-fuchsia-500-rgb));--spectrum-global-color-fuchsia-600-rgb:157,3,158;--spectrum-global-color-fuchsia-600:rgb(var(--spectrum-global-color-fuchsia-600-rgb));--spectrum-global-color-fuchsia-700-rgb:128,0,129;--spectrum-global-color-fuchsia-700:rgb(var(--spectrum-global-color-fuchsia-700-rgb));--spectrum-global-color-purple-400-rgb:157,87,244;--spectrum-global-color-purple-400:rgb(var(--spectrum-global-color-purple-400-rgb));--spectrum-global-color-purple-500-rgb:137,61,231;--spectrum-global-color-purple-500:rgb(var(--spectrum-global-color-purple-500-rgb));--spectrum-global-color-purple-600-rgb:115,38,211;--spectrum-global-color-purple-600:rgb(var(--spectrum-global-color-purple-600-rgb));--spectrum-global-color-purple-700-rgb:93,19,183;--spectrum-global-color-purple-700:rgb(var(--spectrum-global-color-purple-700-rgb));--spectrum-global-color-indigo-400-rgb:104,109,244;--spectrum-global-color-indigo-400:rgb(var(--spectrum-global-color-indigo-400-rgb));--spectrum-global-color-indigo-500-rgb:82,88,228;--spectrum-global-color-indigo-500:rgb(var(--spectrum-global-color-indigo-500-rgb));--spectrum-global-color-indigo-600-rgb:64,70,202;--spectrum-global-color-indigo-600:rgb(var(--spectrum-global-color-indigo-600-rgb));--spectrum-global-color-indigo-700-rgb:50,54,168;--spectrum-global-color-indigo-700:rgb(var(--spectrum-global-color-indigo-700-rgb));--spectrum-global-color-seafoam-400-rgb:0,161,154;--spectrum-global-color-seafoam-400:rgb(var(--spectrum-global-color-seafoam-400-rgb));--spectrum-global-color-seafoam-500-rgb:0,140,135;--spectrum-global-color-seafoam-500:rgb(var(--spectrum-global-color-seafoam-500-rgb));--spectrum-global-color-seafoam-600-rgb:0,119,114;--spectrum-global-color-seafoam-600:rgb(var(--spectrum-global-color-seafoam-600-rgb));--spectrum-global-color-seafoam-700-rgb:0,99,95;--spectrum-global-color-seafoam-700:rgb(var(--spectrum-global-color-seafoam-700-rgb));--spectrum-global-color-red-400-rgb:234,56,41;--spectrum-global-color-red-400:rgb(var(--spectrum-global-color-red-400-rgb));--spectrum-global-color-red-500-rgb:211,21,16;--spectrum-global-color-red-500:rgb(var(--spectrum-global-color-red-500-rgb));--spectrum-global-color-red-600-rgb:180,0,0;--spectrum-global-color-red-600:rgb(var(--spectrum-global-color-red-600-rgb));--spectrum-global-color-red-700-rgb:147,0,0;--spectrum-global-color-red-700:rgb(var(--spectrum-global-color-red-700-rgb));--spectrum-global-color-orange-400-rgb:246,133,17;--spectrum-global-color-orange-400:rgb(var(--spectrum-global-color-orange-400-rgb));--spectrum-global-color-orange-500-rgb:228,111,0;--spectrum-global-color-orange-500:rgb(var(--spectrum-global-color-orange-500-rgb));--spectrum-global-color-orange-600-rgb:203,93,0;--spectrum-global-color-orange-600:rgb(var(--spectrum-global-color-orange-600-rgb));--spectrum-global-color-orange-700-rgb:177,76,0;--spectrum-global-color-orange-700:rgb(var(--spectrum-global-color-orange-700-rgb));--spectrum-global-color-green-400-rgb:0,143,93;--spectrum-global-color-green-400:rgb(var(--spectrum-global-color-green-400-rgb));--spectrum-global-color-green-500-rgb:0,122,77;--spectrum-global-color-green-500:rgb(var(--spectrum-global-color-green-500-rgb));--spectrum-global-color-green-600-rgb:0,101,62;--spectrum-global-color-green-600:rgb(var(--spectrum-global-color-green-600-rgb));--spectrum-global-color-green-700-rgb:0,81,50;--spectrum-global-color-green-700:rgb(var(--spectrum-global-color-green-700-rgb));--spectrum-global-color-blue-400-rgb:20,122,243;--spectrum-global-color-blue-400:rgb(var(--spectrum-global-color-blue-400-rgb));--spectrum-global-color-blue-500-rgb:2,101,220;--spectrum-global-color-blue-500:rgb(var(--spectrum-global-color-blue-500-rgb));--spectrum-global-color-blue-600-rgb:0,84,182;--spectrum-global-color-blue-600:rgb(var(--spectrum-global-color-blue-600-rgb));--spectrum-global-color-blue-700-rgb:0,68,145;--spectrum-global-color-blue-700:rgb(var(--spectrum-global-color-blue-700-rgb));--spectrum-global-color-gray-50-rgb:255,255,255;--spectrum-global-color-gray-50:rgb(var(--spectrum-global-color-gray-50-rgb));--spectrum-global-color-gray-75-rgb:253,253,253;--spectrum-global-color-gray-75:rgb(var(--spectrum-global-color-gray-75-rgb));--spectrum-global-color-gray-100-rgb:248,248,248;--spectrum-global-color-gray-100:rgb(var(--spectrum-global-color-gray-100-rgb));--spectrum-global-color-gray-200-rgb:230,230,230;--spectrum-global-color-gray-200:rgb(var(--spectrum-global-color-gray-200-rgb));--spectrum-global-color-gray-300-rgb:213,213,213;--spectrum-global-color-gray-300:rgb(var(--spectrum-global-color-gray-300-rgb));--spectrum-global-color-gray-400-rgb:177,177,177;--spectrum-global-color-gray-400:rgb(var(--spectrum-global-color-gray-400-rgb));--spectrum-global-color-gray-500-rgb:144,144,144;--spectrum-global-color-gray-500:rgb(var(--spectrum-global-color-gray-500-rgb));--spectrum-global-color-gray-600-rgb:109,109,109;--spectrum-global-color-gray-600:rgb(var(--spectrum-global-color-gray-600-rgb));--spectrum-global-color-gray-700-rgb:70,70,70;--spectrum-global-color-gray-700:rgb(var(--spectrum-global-color-gray-700-rgb));--spectrum-global-color-gray-800-rgb:34,34,34;--spectrum-global-color-gray-800:rgb(var(--spectrum-global-color-gray-800-rgb));--spectrum-global-color-gray-900-rgb:0,0,0;--spectrum-global-color-gray-900:rgb(var(--spectrum-global-color-gray-900-rgb));--spectrum-alias-background-color-primary:var(--spectrum-global-color-gray-50);--spectrum-alias-background-color-secondary:var(--spectrum-global-color-gray-100);--spectrum-alias-background-color-tertiary:var(--spectrum-global-color-gray-300);--spectrum-alias-background-color-modal-overlay:#0006;--spectrum-alias-dropshadow-color:#00000026;--spectrum-alias-background-color-hover-overlay:#0000000a;--spectrum-alias-highlight-hover:#0000000f;--spectrum-alias-highlight-down:#0000001a;--spectrum-alias-highlight-selected:#0265dc1a;--spectrum-alias-highlight-selected-hover:#0265dc33;--spectrum-alias-text-highlight-color:#0265dc33;--spectrum-alias-background-color-quickactions:#f8f8f8e6;--spectrum-alias-border-color-selected:var(--spectrum-global-color-blue-500);--spectrum-alias-border-color-translucent:#0000001a;--spectrum-alias-radial-reaction-color-default:#2229;--spectrum-alias-pasteboard-background-color:var(--spectrum-global-color-gray-300);--spectrum-alias-appframe-border-color:var(--spectrum-global-color-gray-300);--spectrum-alias-appframe-separator-color:var(--spectrum-global-color-gray-300)}:host,:root{color-scheme:light;--spectrum-overlay-opacity:.4;--spectrum-drop-shadow-color-rgb:0,0,0;--spectrum-drop-shadow-color-opacity:.15;--spectrum-drop-shadow-color:rgba(var(--spectrum-drop-shadow-color-rgb),var(--spectrum-drop-shadow-color-opacity));--spectrum-background-base-color:var(--spectrum-gray-200);--spectrum-background-layer-1-color:var(--spectrum-gray-100);--spectrum-background-layer-2-color:var(--spectrum-gray-50);--spectrum-neutral-background-color-default:var(--spectrum-gray-800);--spectrum-neutral-background-color-hover:var(--spectrum-gray-900);--spectrum-neutral-background-color-down:var(--spectrum-gray-900);--spectrum-neutral-background-color-key-focus:var(--spectrum-gray-900);--spectrum-neutral-subdued-background-color-default:var(--spectrum-gray-600);--spectrum-neutral-subdued-background-color-hover:var(--spectrum-gray-700);--spectrum-neutral-subdued-background-color-down:var(--spectrum-gray-800);--spectrum-neutral-subdued-background-color-key-focus:var(--spectrum-gray-700);--spectrum-accent-background-color-default:var(--spectrum-accent-color-900);--spectrum-accent-background-color-hover:var(--spectrum-accent-color-1000);--spectrum-accent-background-color-down:var(--spectrum-accent-color-1100);--spectrum-accent-background-color-key-focus:var(--spectrum-accent-color-1000);--spectrum-informative-background-color-default:var(--spectrum-informative-color-900);--spectrum-informative-background-color-hover:var(--spectrum-informative-color-1000);--spectrum-informative-background-color-down:var(--spectrum-informative-color-1100);--spectrum-informative-background-color-key-focus:var(--spectrum-informative-color-1000);--spectrum-negative-background-color-default:var(--spectrum-negative-color-900);--spectrum-negative-background-color-hover:var(--spectrum-negative-color-1000);--spectrum-negative-background-color-down:var(--spectrum-negative-color-1100);--spectrum-negative-background-color-key-focus:var(--spectrum-negative-color-1000);--spectrum-positive-background-color-default:var(--spectrum-positive-color-900);--spectrum-positive-background-color-hover:var(--spectrum-positive-color-1000);--spectrum-positive-background-color-down:var(--spectrum-positive-color-1100);--spectrum-positive-background-color-key-focus:var(--spectrum-positive-color-1000);--spectrum-notice-background-color-default:var(--spectrum-notice-color-600);--spectrum-gray-background-color-default:var(--spectrum-gray-700);--spectrum-red-background-color-default:var(--spectrum-red-900);--spectrum-orange-background-color-default:var(--spectrum-orange-600);--spectrum-yellow-background-color-default:var(--spectrum-yellow-400);--spectrum-chartreuse-background-color-default:var(--spectrum-chartreuse-500);--spectrum-celery-background-color-default:var(--spectrum-celery-600);--spectrum-green-background-color-default:var(--spectrum-green-900);--spectrum-seafoam-background-color-default:var(--spectrum-seafoam-900);--spectrum-cyan-background-color-default:var(--spectrum-cyan-900);--spectrum-blue-background-color-default:var(--spectrum-blue-900);--spectrum-indigo-background-color-default:var(--spectrum-indigo-900);--spectrum-purple-background-color-default:var(--spectrum-purple-900);--spectrum-fuchsia-background-color-default:var(--spectrum-fuchsia-900);--spectrum-magenta-background-color-default:var(--spectrum-magenta-900);--spectrum-neutral-visual-color:var(--spectrum-gray-500);--spectrum-accent-visual-color:var(--spectrum-accent-color-800);--spectrum-informative-visual-color:var(--spectrum-informative-color-800);--spectrum-negative-visual-color:var(--spectrum-negative-color-800);--spectrum-notice-visual-color:var(--spectrum-notice-color-700);--spectrum-positive-visual-color:var(--spectrum-positive-color-700);--spectrum-gray-visual-color:var(--spectrum-gray-500);--spectrum-red-visual-color:var(--spectrum-red-800);--spectrum-orange-visual-color:var(--spectrum-orange-700);--spectrum-yellow-visual-color:var(--spectrum-yellow-600);--spectrum-chartreuse-visual-color:var(--spectrum-chartreuse-600);--spectrum-celery-visual-color:var(--spectrum-celery-700);--spectrum-green-visual-color:var(--spectrum-green-700);--spectrum-seafoam-visual-color:var(--spectrum-seafoam-700);--spectrum-cyan-visual-color:var(--spectrum-cyan-600);--spectrum-blue-visual-color:var(--spectrum-blue-800);--spectrum-indigo-visual-color:var(--spectrum-indigo-800);--spectrum-purple-visual-color:var(--spectrum-purple-800);--spectrum-fuchsia-visual-color:var(--spectrum-fuchsia-800);--spectrum-magenta-visual-color:var(--spectrum-magenta-800);--spectrum-opacity-checkerboard-square-dark:var(--spectrum-gray-200);--spectrum-gray-50-rgb:255,255,255;--spectrum-gray-50:rgba(var(--spectrum-gray-50-rgb));--spectrum-gray-75-rgb:253,253,253;--spectrum-gray-75:rgba(var(--spectrum-gray-75-rgb));--spectrum-gray-100-rgb:248,248,248;--spectrum-gray-100:rgba(var(--spectrum-gray-100-rgb));--spectrum-gray-200-rgb:230,230,230;--spectrum-gray-200:rgba(var(--spectrum-gray-200-rgb));--spectrum-gray-300-rgb:213,213,213;--spectrum-gray-300:rgba(var(--spectrum-gray-300-rgb));--spectrum-gray-400-rgb:177,177,177;--spectrum-gray-400:rgba(var(--spectrum-gray-400-rgb));--spectrum-gray-500-rgb:144,144,144;--spectrum-gray-500:rgba(var(--spectrum-gray-500-rgb));--spectrum-gray-600-rgb:109,109,109;--spectrum-gray-600:rgba(var(--spectrum-gray-600-rgb));--spectrum-gray-700-rgb:70,70,70;--spectrum-gray-700:rgba(var(--spectrum-gray-700-rgb));--spectrum-gray-800-rgb:34,34,34;--spectrum-gray-800:rgba(var(--spectrum-gray-800-rgb));--spectrum-gray-900-rgb:0,0,0;--spectrum-gray-900:rgba(var(--spectrum-gray-900-rgb));--spectrum-blue-100-rgb:224,242,255;--spectrum-blue-100:rgba(var(--spectrum-blue-100-rgb));--spectrum-blue-200-rgb:202,232,255;--spectrum-blue-200:rgba(var(--spectrum-blue-200-rgb));--spectrum-blue-300-rgb:181,222,255;--spectrum-blue-300:rgba(var(--spectrum-blue-300-rgb));--spectrum-blue-400-rgb:150,206,253;--spectrum-blue-400:rgba(var(--spectrum-blue-400-rgb));--spectrum-blue-500-rgb:120,187,250;--spectrum-blue-500:rgba(var(--spectrum-blue-500-rgb));--spectrum-blue-600-rgb:89,167,246;--spectrum-blue-600:rgba(var(--spectrum-blue-600-rgb));--spectrum-blue-700-rgb:56,146,243;--spectrum-blue-700:rgba(var(--spectrum-blue-700-rgb));--spectrum-blue-800-rgb:20,122,243;--spectrum-blue-800:rgba(var(--spectrum-blue-800-rgb));--spectrum-blue-900-rgb:2,101,220;--spectrum-blue-900:rgba(var(--spectrum-blue-900-rgb));--spectrum-blue-1000-rgb:0,84,182;--spectrum-blue-1000:rgba(var(--spectrum-blue-1000-rgb));--spectrum-blue-1100-rgb:0,68,145;--spectrum-blue-1100:rgba(var(--spectrum-blue-1100-rgb));--spectrum-blue-1200-rgb:0,53,113;--spectrum-blue-1200:rgba(var(--spectrum-blue-1200-rgb));--spectrum-blue-1300-rgb:0,39,84;--spectrum-blue-1300:rgba(var(--spectrum-blue-1300-rgb));--spectrum-blue-1400-rgb:0,28,60;--spectrum-blue-1400:rgba(var(--spectrum-blue-1400-rgb));--spectrum-red-100-rgb:255,235,231;--spectrum-red-100:rgba(var(--spectrum-red-100-rgb));--spectrum-red-200-rgb:255,221,214;--spectrum-red-200:rgba(var(--spectrum-red-200-rgb));--spectrum-red-300-rgb:255,205,195;--spectrum-red-300:rgba(var(--spectrum-red-300-rgb));--spectrum-red-400-rgb:255,183,169;--spectrum-red-400:rgba(var(--spectrum-red-400-rgb));--spectrum-red-500-rgb:255,155,136;--spectrum-red-500:rgba(var(--spectrum-red-500-rgb));--spectrum-red-600-rgb:255,124,101;--spectrum-red-600:rgba(var(--spectrum-red-600-rgb));--spectrum-red-700-rgb:247,92,70;--spectrum-red-700:rgba(var(--spectrum-red-700-rgb));--spectrum-red-800-rgb:234,56,41;--spectrum-red-800:rgba(var(--spectrum-red-800-rgb));--spectrum-red-900-rgb:211,21,16;--spectrum-red-900:rgba(var(--spectrum-red-900-rgb));--spectrum-red-1000-rgb:180,0,0;--spectrum-red-1000:rgba(var(--spectrum-red-1000-rgb));--spectrum-red-1100-rgb:147,0,0;--spectrum-red-1100:rgba(var(--spectrum-red-1100-rgb));--spectrum-red-1200-rgb:116,0,0;--spectrum-red-1200:rgba(var(--spectrum-red-1200-rgb));--spectrum-red-1300-rgb:89,0,0;--spectrum-red-1300:rgba(var(--spectrum-red-1300-rgb));--spectrum-red-1400-rgb:67,0,0;--spectrum-red-1400:rgba(var(--spectrum-red-1400-rgb));--spectrum-orange-100-rgb:255,236,204;--spectrum-orange-100:rgba(var(--spectrum-orange-100-rgb));--spectrum-orange-200-rgb:255,223,173;--spectrum-orange-200:rgba(var(--spectrum-orange-200-rgb));--spectrum-orange-300-rgb:253,210,145;--spectrum-orange-300:rgba(var(--spectrum-orange-300-rgb));--spectrum-orange-400-rgb:255,187,99;--spectrum-orange-400:rgba(var(--spectrum-orange-400-rgb));--spectrum-orange-500-rgb:255,160,55;--spectrum-orange-500:rgba(var(--spectrum-orange-500-rgb));--spectrum-orange-600-rgb:246,133,17;--spectrum-orange-600:rgba(var(--spectrum-orange-600-rgb));--spectrum-orange-700-rgb:228,111,0;--spectrum-orange-700:rgba(var(--spectrum-orange-700-rgb));--spectrum-orange-800-rgb:203,93,0;--spectrum-orange-800:rgba(var(--spectrum-orange-800-rgb));--spectrum-orange-900-rgb:177,76,0;--spectrum-orange-900:rgba(var(--spectrum-orange-900-rgb));--spectrum-orange-1000-rgb:149,61,0;--spectrum-orange-1000:rgba(var(--spectrum-orange-1000-rgb));--spectrum-orange-1100-rgb:122,47,0;--spectrum-orange-1100:rgba(var(--spectrum-orange-1100-rgb));--spectrum-orange-1200-rgb:97,35,0;--spectrum-orange-1200:rgba(var(--spectrum-orange-1200-rgb));--spectrum-orange-1300-rgb:73,25,1;--spectrum-orange-1300:rgba(var(--spectrum-orange-1300-rgb));--spectrum-orange-1400-rgb:53,18,1;--spectrum-orange-1400:rgba(var(--spectrum-orange-1400-rgb));--spectrum-yellow-100-rgb:251,241,152;--spectrum-yellow-100:rgba(var(--spectrum-yellow-100-rgb));--spectrum-yellow-200-rgb:248,231,80;--spectrum-yellow-200:rgba(var(--spectrum-yellow-200-rgb));--spectrum-yellow-300-rgb:248,217,4;--spectrum-yellow-300:rgba(var(--spectrum-yellow-300-rgb));--spectrum-yellow-400-rgb:232,198,0;--spectrum-yellow-400:rgba(var(--spectrum-yellow-400-rgb));--spectrum-yellow-500-rgb:215,179,0;--spectrum-yellow-500:rgba(var(--spectrum-yellow-500-rgb));--spectrum-yellow-600-rgb:196,159,0;--spectrum-yellow-600:rgba(var(--spectrum-yellow-600-rgb));--spectrum-yellow-700-rgb:176,140,0;--spectrum-yellow-700:rgba(var(--spectrum-yellow-700-rgb));--spectrum-yellow-800-rgb:155,120,0;--spectrum-yellow-800:rgba(var(--spectrum-yellow-800-rgb));--spectrum-yellow-900-rgb:133,102,0;--spectrum-yellow-900:rgba(var(--spectrum-yellow-900-rgb));--spectrum-yellow-1000-rgb:112,83,0;--spectrum-yellow-1000:rgba(var(--spectrum-yellow-1000-rgb));--spectrum-yellow-1100-rgb:91,67,0;--spectrum-yellow-1100:rgba(var(--spectrum-yellow-1100-rgb));--spectrum-yellow-1200-rgb:72,51,0;--spectrum-yellow-1200:rgba(var(--spectrum-yellow-1200-rgb));--spectrum-yellow-1300-rgb:54,37,0;--spectrum-yellow-1300:rgba(var(--spectrum-yellow-1300-rgb));--spectrum-yellow-1400-rgb:40,26,0;--spectrum-yellow-1400:rgba(var(--spectrum-yellow-1400-rgb));--spectrum-chartreuse-100-rgb:219,252,110;--spectrum-chartreuse-100:rgba(var(--spectrum-chartreuse-100-rgb));--spectrum-chartreuse-200-rgb:203,244,67;--spectrum-chartreuse-200:rgba(var(--spectrum-chartreuse-200-rgb));--spectrum-chartreuse-300-rgb:188,233,42;--spectrum-chartreuse-300:rgba(var(--spectrum-chartreuse-300-rgb));--spectrum-chartreuse-400-rgb:170,216,22;--spectrum-chartreuse-400:rgba(var(--spectrum-chartreuse-400-rgb));--spectrum-chartreuse-500-rgb:152,197,10;--spectrum-chartreuse-500:rgba(var(--spectrum-chartreuse-500-rgb));--spectrum-chartreuse-600-rgb:135,177,3;--spectrum-chartreuse-600:rgba(var(--spectrum-chartreuse-600-rgb));--spectrum-chartreuse-700-rgb:118,156,0;--spectrum-chartreuse-700:rgba(var(--spectrum-chartreuse-700-rgb));--spectrum-chartreuse-800-rgb:103,136,0;--spectrum-chartreuse-800:rgba(var(--spectrum-chartreuse-800-rgb));--spectrum-chartreuse-900-rgb:87,116,0;--spectrum-chartreuse-900:rgba(var(--spectrum-chartreuse-900-rgb));--spectrum-chartreuse-1000-rgb:72,96,0;--spectrum-chartreuse-1000:rgba(var(--spectrum-chartreuse-1000-rgb));--spectrum-chartreuse-1100-rgb:58,77,0;--spectrum-chartreuse-1100:rgba(var(--spectrum-chartreuse-1100-rgb));--spectrum-chartreuse-1200-rgb:44,59,0;--spectrum-chartreuse-1200:rgba(var(--spectrum-chartreuse-1200-rgb));--spectrum-chartreuse-1300-rgb:33,44,0;--spectrum-chartreuse-1300:rgba(var(--spectrum-chartreuse-1300-rgb));--spectrum-chartreuse-1400-rgb:24,31,0;--spectrum-chartreuse-1400:rgba(var(--spectrum-chartreuse-1400-rgb));--spectrum-celery-100-rgb:205,252,191;--spectrum-celery-100:rgba(var(--spectrum-celery-100-rgb));--spectrum-celery-200-rgb:174,246,157;--spectrum-celery-200:rgba(var(--spectrum-celery-200-rgb));--spectrum-celery-300-rgb:150,238,133;--spectrum-celery-300:rgba(var(--spectrum-celery-300-rgb));--spectrum-celery-400-rgb:114,224,106;--spectrum-celery-400:rgba(var(--spectrum-celery-400-rgb));--spectrum-celery-500-rgb:78,207,80;--spectrum-celery-500:rgba(var(--spectrum-celery-500-rgb));--spectrum-celery-600-rgb:39,187,54;--spectrum-celery-600:rgba(var(--spectrum-celery-600-rgb));--spectrum-celery-700-rgb:7,167,33;--spectrum-celery-700:rgba(var(--spectrum-celery-700-rgb));--spectrum-celery-800-rgb:0,145,18;--spectrum-celery-800:rgba(var(--spectrum-celery-800-rgb));--spectrum-celery-900-rgb:0,124,15;--spectrum-celery-900:rgba(var(--spectrum-celery-900-rgb));--spectrum-celery-1000-rgb:0,103,15;--spectrum-celery-1000:rgba(var(--spectrum-celery-1000-rgb));--spectrum-celery-1100-rgb:0,83,13;--spectrum-celery-1100:rgba(var(--spectrum-celery-1100-rgb));--spectrum-celery-1200-rgb:0,64,10;--spectrum-celery-1200:rgba(var(--spectrum-celery-1200-rgb));--spectrum-celery-1300-rgb:0,48,7;--spectrum-celery-1300:rgba(var(--spectrum-celery-1300-rgb));--spectrum-celery-1400-rgb:0,34,5;--spectrum-celery-1400:rgba(var(--spectrum-celery-1400-rgb));--spectrum-green-100-rgb:206,248,224;--spectrum-green-100:rgba(var(--spectrum-green-100-rgb));--spectrum-green-200-rgb:173,244,206;--spectrum-green-200:rgba(var(--spectrum-green-200-rgb));--spectrum-green-300-rgb:137,236,188;--spectrum-green-300:rgba(var(--spectrum-green-300-rgb));--spectrum-green-400-rgb:103,222,168;--spectrum-green-400:rgba(var(--spectrum-green-400-rgb));--spectrum-green-500-rgb:73,204,147;--spectrum-green-500:rgba(var(--spectrum-green-500-rgb));--spectrum-green-600-rgb:47,184,128;--spectrum-green-600:rgba(var(--spectrum-green-600-rgb));--spectrum-green-700-rgb:21,164,110;--spectrum-green-700:rgba(var(--spectrum-green-700-rgb));--spectrum-green-800-rgb:0,143,93;--spectrum-green-800:rgba(var(--spectrum-green-800-rgb));--spectrum-green-900-rgb:0,122,77;--spectrum-green-900:rgba(var(--spectrum-green-900-rgb));--spectrum-green-1000-rgb:0,101,62;--spectrum-green-1000:rgba(var(--spectrum-green-1000-rgb));--spectrum-green-1100-rgb:0,81,50;--spectrum-green-1100:rgba(var(--spectrum-green-1100-rgb));--spectrum-green-1200-rgb:5,63,39;--spectrum-green-1200:rgba(var(--spectrum-green-1200-rgb));--spectrum-green-1300-rgb:10,46,29;--spectrum-green-1300:rgba(var(--spectrum-green-1300-rgb));--spectrum-green-1400-rgb:10,32,21;--spectrum-green-1400:rgba(var(--spectrum-green-1400-rgb));--spectrum-seafoam-100-rgb:206,247,243;--spectrum-seafoam-100:rgba(var(--spectrum-seafoam-100-rgb));--spectrum-seafoam-200-rgb:170,241,234;--spectrum-seafoam-200:rgba(var(--spectrum-seafoam-200-rgb));--spectrum-seafoam-300-rgb:140,233,226;--spectrum-seafoam-300:rgba(var(--spectrum-seafoam-300-rgb));--spectrum-seafoam-400-rgb:101,218,210;--spectrum-seafoam-400:rgba(var(--spectrum-seafoam-400-rgb));--spectrum-seafoam-500-rgb:63,201,193;--spectrum-seafoam-500:rgba(var(--spectrum-seafoam-500-rgb));--spectrum-seafoam-600-rgb:15,181,174;--spectrum-seafoam-600:rgba(var(--spectrum-seafoam-600-rgb));--spectrum-seafoam-700-rgb:0,161,154;--spectrum-seafoam-700:rgba(var(--spectrum-seafoam-700-rgb));--spectrum-seafoam-800-rgb:0,140,135;--spectrum-seafoam-800:rgba(var(--spectrum-seafoam-800-rgb));--spectrum-seafoam-900-rgb:0,119,114;--spectrum-seafoam-900:rgba(var(--spectrum-seafoam-900-rgb));--spectrum-seafoam-1000-rgb:0,99,95;--spectrum-seafoam-1000:rgba(var(--spectrum-seafoam-1000-rgb));--spectrum-seafoam-1100-rgb:12,79,76;--spectrum-seafoam-1100:rgba(var(--spectrum-seafoam-1100-rgb));--spectrum-seafoam-1200-rgb:18,60,58;--spectrum-seafoam-1200:rgba(var(--spectrum-seafoam-1200-rgb));--spectrum-seafoam-1300-rgb:18,44,43;--spectrum-seafoam-1300:rgba(var(--spectrum-seafoam-1300-rgb));--spectrum-seafoam-1400-rgb:15,31,30;--spectrum-seafoam-1400:rgba(var(--spectrum-seafoam-1400-rgb));--spectrum-cyan-100-rgb:197,248,255;--spectrum-cyan-100:rgba(var(--spectrum-cyan-100-rgb));--spectrum-cyan-200-rgb:164,240,255;--spectrum-cyan-200:rgba(var(--spectrum-cyan-200-rgb));--spectrum-cyan-300-rgb:136,231,250;--spectrum-cyan-300:rgba(var(--spectrum-cyan-300-rgb));--spectrum-cyan-400-rgb:96,216,243;--spectrum-cyan-400:rgba(var(--spectrum-cyan-400-rgb));--spectrum-cyan-500-rgb:51,197,232;--spectrum-cyan-500:rgba(var(--spectrum-cyan-500-rgb));--spectrum-cyan-600-rgb:18,176,218;--spectrum-cyan-600:rgba(var(--spectrum-cyan-600-rgb));--spectrum-cyan-700-rgb:1,156,200;--spectrum-cyan-700:rgba(var(--spectrum-cyan-700-rgb));--spectrum-cyan-800-rgb:0,134,180;--spectrum-cyan-800:rgba(var(--spectrum-cyan-800-rgb));--spectrum-cyan-900-rgb:0,113,159;--spectrum-cyan-900:rgba(var(--spectrum-cyan-900-rgb));--spectrum-cyan-1000-rgb:0,93,137;--spectrum-cyan-1000:rgba(var(--spectrum-cyan-1000-rgb));--spectrum-cyan-1100-rgb:0,74,115;--spectrum-cyan-1100:rgba(var(--spectrum-cyan-1100-rgb));--spectrum-cyan-1200-rgb:0,57,93;--spectrum-cyan-1200:rgba(var(--spectrum-cyan-1200-rgb));--spectrum-cyan-1300-rgb:0,42,70;--spectrum-cyan-1300:rgba(var(--spectrum-cyan-1300-rgb));--spectrum-cyan-1400-rgb:0,30,51;--spectrum-cyan-1400:rgba(var(--spectrum-cyan-1400-rgb));--spectrum-indigo-100-rgb:237,238,255;--spectrum-indigo-100:rgba(var(--spectrum-indigo-100-rgb));--spectrum-indigo-200-rgb:224,226,255;--spectrum-indigo-200:rgba(var(--spectrum-indigo-200-rgb));--spectrum-indigo-300-rgb:211,213,255;--spectrum-indigo-300:rgba(var(--spectrum-indigo-300-rgb));--spectrum-indigo-400-rgb:193,196,255;--spectrum-indigo-400:rgba(var(--spectrum-indigo-400-rgb));--spectrum-indigo-500-rgb:172,175,255;--spectrum-indigo-500:rgba(var(--spectrum-indigo-500-rgb));--spectrum-indigo-600-rgb:149,153,255;--spectrum-indigo-600:rgba(var(--spectrum-indigo-600-rgb));--spectrum-indigo-700-rgb:126,132,252;--spectrum-indigo-700:rgba(var(--spectrum-indigo-700-rgb));--spectrum-indigo-800-rgb:104,109,244;--spectrum-indigo-800:rgba(var(--spectrum-indigo-800-rgb));--spectrum-indigo-900-rgb:82,88,228;--spectrum-indigo-900:rgba(var(--spectrum-indigo-900-rgb));--spectrum-indigo-1000-rgb:64,70,202;--spectrum-indigo-1000:rgba(var(--spectrum-indigo-1000-rgb));--spectrum-indigo-1100-rgb:50,54,168;--spectrum-indigo-1100:rgba(var(--spectrum-indigo-1100-rgb));--spectrum-indigo-1200-rgb:38,41,134;--spectrum-indigo-1200:rgba(var(--spectrum-indigo-1200-rgb));--spectrum-indigo-1300-rgb:27,30,100;--spectrum-indigo-1300:rgba(var(--spectrum-indigo-1300-rgb));--spectrum-indigo-1400-rgb:20,22,72;--spectrum-indigo-1400:rgba(var(--spectrum-indigo-1400-rgb));--spectrum-purple-100-rgb:246,235,255;--spectrum-purple-100:rgba(var(--spectrum-purple-100-rgb));--spectrum-purple-200-rgb:238,221,255;--spectrum-purple-200:rgba(var(--spectrum-purple-200-rgb));--spectrum-purple-300-rgb:230,208,255;--spectrum-purple-300:rgba(var(--spectrum-purple-300-rgb));--spectrum-purple-400-rgb:219,187,254;--spectrum-purple-400:rgba(var(--spectrum-purple-400-rgb));--spectrum-purple-500-rgb:204,164,253;--spectrum-purple-500:rgba(var(--spectrum-purple-500-rgb));--spectrum-purple-600-rgb:189,139,252;--spectrum-purple-600:rgba(var(--spectrum-purple-600-rgb));--spectrum-purple-700-rgb:174,114,249;--spectrum-purple-700:rgba(var(--spectrum-purple-700-rgb));--spectrum-purple-800-rgb:157,87,244;--spectrum-purple-800:rgba(var(--spectrum-purple-800-rgb));--spectrum-purple-900-rgb:137,61,231;--spectrum-purple-900:rgba(var(--spectrum-purple-900-rgb));--spectrum-purple-1000-rgb:115,38,211;--spectrum-purple-1000:rgba(var(--spectrum-purple-1000-rgb));--spectrum-purple-1100-rgb:93,19,183;--spectrum-purple-1100:rgba(var(--spectrum-purple-1100-rgb));--spectrum-purple-1200-rgb:71,12,148;--spectrum-purple-1200:rgba(var(--spectrum-purple-1200-rgb));--spectrum-purple-1300-rgb:51,16,106;--spectrum-purple-1300:rgba(var(--spectrum-purple-1300-rgb));--spectrum-purple-1400-rgb:35,15,73;--spectrum-purple-1400:rgba(var(--spectrum-purple-1400-rgb));--spectrum-fuchsia-100-rgb:255,233,252;--spectrum-fuchsia-100:rgba(var(--spectrum-fuchsia-100-rgb));--spectrum-fuchsia-200-rgb:255,218,250;--spectrum-fuchsia-200:rgba(var(--spectrum-fuchsia-200-rgb));--spectrum-fuchsia-300-rgb:254,199,248;--spectrum-fuchsia-300:rgba(var(--spectrum-fuchsia-300-rgb));--spectrum-fuchsia-400-rgb:251,174,246;--spectrum-fuchsia-400:rgba(var(--spectrum-fuchsia-400-rgb));--spectrum-fuchsia-500-rgb:245,146,243;--spectrum-fuchsia-500:rgba(var(--spectrum-fuchsia-500-rgb));--spectrum-fuchsia-600-rgb:237,116,237;--spectrum-fuchsia-600:rgba(var(--spectrum-fuchsia-600-rgb));--spectrum-fuchsia-700-rgb:224,85,226;--spectrum-fuchsia-700:rgba(var(--spectrum-fuchsia-700-rgb));--spectrum-fuchsia-800-rgb:205,58,206;--spectrum-fuchsia-800:rgba(var(--spectrum-fuchsia-800-rgb));--spectrum-fuchsia-900-rgb:182,34,183;--spectrum-fuchsia-900:rgba(var(--spectrum-fuchsia-900-rgb));--spectrum-fuchsia-1000-rgb:157,3,158;--spectrum-fuchsia-1000:rgba(var(--spectrum-fuchsia-1000-rgb));--spectrum-fuchsia-1100-rgb:128,0,129;--spectrum-fuchsia-1100:rgba(var(--spectrum-fuchsia-1100-rgb));--spectrum-fuchsia-1200-rgb:100,6,100;--spectrum-fuchsia-1200:rgba(var(--spectrum-fuchsia-1200-rgb));--spectrum-fuchsia-1300-rgb:71,14,70;--spectrum-fuchsia-1300:rgba(var(--spectrum-fuchsia-1300-rgb));--spectrum-fuchsia-1400-rgb:50,13,49;--spectrum-fuchsia-1400:rgba(var(--spectrum-fuchsia-1400-rgb));--spectrum-magenta-100-rgb:255,234,241;--spectrum-magenta-100:rgba(var(--spectrum-magenta-100-rgb));--spectrum-magenta-200-rgb:255,220,232;--spectrum-magenta-200:rgba(var(--spectrum-magenta-200-rgb));--spectrum-magenta-300-rgb:255,202,221;--spectrum-magenta-300:rgba(var(--spectrum-magenta-300-rgb));--spectrum-magenta-400-rgb:255,178,206;--spectrum-magenta-400:rgba(var(--spectrum-magenta-400-rgb));--spectrum-magenta-500-rgb:255,149,189;--spectrum-magenta-500:rgba(var(--spectrum-magenta-500-rgb));--spectrum-magenta-600-rgb:250,119,170;--spectrum-magenta-600:rgba(var(--spectrum-magenta-600-rgb));--spectrum-magenta-700-rgb:239,90,152;--spectrum-magenta-700:rgba(var(--spectrum-magenta-700-rgb));--spectrum-magenta-800-rgb:222,61,130;--spectrum-magenta-800:rgba(var(--spectrum-magenta-800-rgb));--spectrum-magenta-900-rgb:200,34,105;--spectrum-magenta-900:rgba(var(--spectrum-magenta-900-rgb));--spectrum-magenta-1000-rgb:173,9,85;--spectrum-magenta-1000:rgba(var(--spectrum-magenta-1000-rgb));--spectrum-magenta-1100-rgb:142,0,69;--spectrum-magenta-1100:rgba(var(--spectrum-magenta-1100-rgb));--spectrum-magenta-1200-rgb:112,0,55;--spectrum-magenta-1200:rgba(var(--spectrum-magenta-1200-rgb));--spectrum-magenta-1300-rgb:84,3,42;--spectrum-magenta-1300:rgba(var(--spectrum-magenta-1300-rgb));--spectrum-magenta-1400-rgb:60,6,29;--spectrum-magenta-1400:rgba(var(--spectrum-magenta-1400-rgb));--spectrum-icon-color-blue-primary-default:var(--spectrum-blue-900);--spectrum-icon-color-green-primary-default:var(--spectrum-green-900);--spectrum-icon-color-red-primary-default:var(--spectrum-red-900);--spectrum-icon-color-yellow-primary-default:var(--spectrum-yellow-400);--spectrum-menu-item-background-color-default-rgb:0,0,0;--spectrum-menu-item-background-color-default-opacity:0;--spectrum-menu-item-background-color-default:rgba(var(--spectrum-menu-item-background-color-default-rgb),var(--spectrum-menu-item-background-color-default-opacity));--spectrum-menu-item-background-color-hover:var(--spectrum-transparent-black-200);--spectrum-menu-item-background-color-down:var(--spectrum-transparent-black-200);--spectrum-menu-item-background-color-key-focus:var(--spectrum-transparent-black-200);--spectrum-drop-zone-background-color-rgb:var(--spectrum-blue-800-rgb);--spectrum-dropindicator-color:var(--spectrum-blue-800);--spectrum-calendar-day-background-color-selected:rgba(var(--spectrum-blue-900-rgb),.1);--spectrum-calendar-day-background-color-hover:rgba(var(--spectrum-black-rgb),.06);--spectrum-calendar-day-today-background-color-selected-hover:rgba(var(--spectrum-blue-900-rgb),.2);--spectrum-calendar-day-background-color-selected-hover:rgba(var(--spectrum-blue-900-rgb),.2);--spectrum-calendar-day-background-color-down:var(--spectrum-transparent-black-200);--spectrum-calendar-day-background-color-cap-selected:rgba(var(--spectrum-blue-900-rgb),.2);--spectrum-calendar-day-background-color-key-focus:rgba(var(--spectrum-black-rgb),.06);--spectrum-calendar-day-border-color-key-focus:var(--spectrum-blue-800);--spectrum-badge-label-icon-color-primary:var(--spectrum-white);--spectrum-coach-indicator-ring-default-color:var(--spectrum-blue-800);--spectrum-coach-indicator-ring-dark-color:var(--spectrum-gray-900);--spectrum-coach-indicator-ring-light-color:var(--spectrum-gray-50);--spectrum-well-border-color:var(--spectrum-black-rgb);--spectrum-steplist-current-marker-color-key-focus:var(--spectrum-blue-800);--spectrum-treeview-item-background-color-quiet-selected:rgba(var(--spectrum-gray-900-rgb),.06);--spectrum-treeview-item-background-color-selected:rgba(var(--spectrum-blue-900-rgb),.1);--spectrum-logic-button-and-background-color:var(--spectrum-blue-900);--spectrum-logic-button-and-border-color:var(--spectrum-blue-900);--spectrum-logic-button-and-background-color-hover:var(--spectrum-blue-1100);--spectrum-logic-button-and-border-color-hover:var(--spectrum-blue-1100);--spectrum-logic-button-or-background-color:var(--spectrum-magenta-900);--spectrum-logic-button-or-border-color:var(--spectrum-magenta-900);--spectrum-logic-button-or-background-color-hover:var(--spectrum-magenta-1100);--spectrum-logic-button-or-border-color-hover:var(--spectrum-magenta-1100);--spectrum-assetcard-border-color-selected:var(--spectrum-blue-900);--spectrum-assetcard-border-color-selected-hover:var(--spectrum-blue-900);--spectrum-assetcard-border-color-selected-down:var(--spectrum-blue-1000);--spectrum-assetcard-selectionindicator-background-color-ordered:var(--spectrum-blue-900);--spectrum-assestcard-focus-indicator-color:var(--spectrum-blue-800);--spectrum-assetlist-item-background-color-selected-hover:rgba(var(--spectrum-blue-900-rgb),.2);--spectrum-assetlist-item-background-color-selected:rgba(var(--spectrum-blue-900-rgb),.1);--spectrum-assetlist-border-color-key-focus:var(--spectrum-blue-800)}
`;
var theme_light_css_default = e21;

// ../node_modules/@spectrum-web-components/theme/theme-light.js
Theme.registerThemeFragment("light", "color", theme_light_css_default);
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

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/if-defined.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
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

lit-html/directives/class-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/style-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/async-directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/private-async-helpers.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/until.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/live.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/when.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/join.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=swc.js.map
