var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/constants.js
var Commitment = Object.freeze({
  MONTH: "MONTH",
  YEAR: "YEAR",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  PERPETUAL: "PERPETUAL",
  TERM_LICENSE: "TERM_LICENSE",
  ACCESS_PASS: "ACCESS_PASS",
  THREE_MONTHS: "THREE_MONTHS",
  SIX_MONTHS: "SIX_MONTHS"
});
var Term = Object.freeze({
  ANNUAL: "ANNUAL",
  MONTHLY: "MONTHLY",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  P1D: "P1D",
  P1Y: "P1Y",
  P3Y: "P3Y",
  P10Y: "P10Y",
  P15Y: "P15Y",
  P3D: "P3D",
  P7D: "P7D",
  P30D: "P30D",
  HALF_YEARLY: "HALF_YEARLY",
  QUARTERLY: "QUARTERLY"
});
var SELECTOR_MAS_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
var SELECTOR_MAS_CHECKOUT_LINK = 'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var SELECTOR_MAS_UPT_LINK = 'a[is="upt-link"]';
var SELECTOR_MAS_ELEMENT = `${SELECTOR_MAS_INLINE_PRICE},${SELECTOR_MAS_CHECKOUT_LINK},${SELECTOR_MAS_UPT_LINK}`;
var EVENT_AEM_LOAD = "aem:load";
var CheckoutWorkflowStep = Object.freeze({
  SEGMENTATION: "segmentation",
  BUNDLE: "bundle",
  COMMITMENT: "commitment",
  RECOMMENDATION: "recommendation",
  EMAIL: "email",
  PAYMENT: "payment",
  CHANGE_PLAN_TEAM_PLANS: "change-plan/team-upgrade/plans",
  CHANGE_PLAN_TEAM_PAYMENT: "change-plan/team-upgrade/payment"
});
var Env = Object.freeze({
  STAGE: "STAGE",
  PRODUCTION: "PRODUCTION",
  LOCAL: "LOCAL"
});
var FF_DEFAULTS = "mas-ff-defaults";

// src/utils.js
var MAS_COMMERCE_SERVICE = "mas-commerce-service";
function getService() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}
function shouldHideStPriceLabels(element) {
  const nextElSibling = element.nextElementSibling?.nodeName === "BR" ? element.nextElementSibling.nextElementSibling : element.nextElementSibling;
  return element.dataset.template === "strikethrough" && (element.nextSibling?.nodeName !== "#text" || element.nextSibling.textContent.trim().length < 2) && nextElSibling?.isInlinePrice && nextElSibling?.dataset?.template === "price";
}

// src/mas-field.js
var MAS_FIELD_TAG = "mas-field";
var CHECKOUT_STYLE_PATTERN = /(accent|primary|secondary)(-(outline|link))?/;
function priceOptionsProvider(element, options) {
  if (!element?.closest?.(MAS_FIELD_TAG)) return options;
  options[FF_DEFAULTS] = true;
  if (shouldHideStPriceLabels(element)) {
    options.displayPerUnit = false;
    options.displayTax = false;
  }
}
function registerPriceOptionsProvider(service) {
  if (!service?.providers || service.providers.has(priceOptionsProvider))
    return;
  service.providers.price(priceOptionsProvider);
}
var MAS_FIELD_STYLES = `
mas-field div[slot="footer"] {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
}
`;
if (!document.querySelector("style[data-mas-field]")) {
  const style = document.createElement("style");
  style.setAttribute("data-mas-field", "");
  style.textContent = MAS_FIELD_STYLES;
  document.head.append(style);
}
var _field, _loaded, _fields, _contentElement, _onFragmentLoad, _MasField_instances, ensureContentElement_fn, normalizeFieldValue_fn, parseFieldAndIndex_fn, extractIndexedAnchor_fn, setFragmentIds_fn, renderField_fn, buildCtaButton_fn, renderCtaField_fn, unwrapSingleParagraph_fn;
var MasField = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _MasField_instances);
    __privateAdd(this, _field, null);
    __privateAdd(this, _loaded, false);
    __privateAdd(this, _fields, null);
    __privateAdd(this, _contentElement, null);
    /** Extracts the target field from the fragment data and renders it as innerHTML. */
    __privateAdd(this, _onFragmentLoad, (event) => {
      if (event.target !== this.aemFragment) return;
      __privateSet(this, _fields, event.detail?.fields || null);
      __privateSet(this, _loaded, true);
      __privateMethod(this, _MasField_instances, renderField_fn).call(this);
    });
  }
  static get observedAttributes() {
    return ["field"];
  }
  /** Stores the field name from the 'field' attribute. */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "field") {
      __privateSet(this, _field, newValue);
      __privateMethod(this, _MasField_instances, renderField_fn).call(this);
    }
  }
  /** Starts listening for aem:load events bubbling from child aem-fragment. */
  connectedCallback() {
    this.addEventListener(EVENT_AEM_LOAD, __privateGet(this, _onFragmentLoad));
    __privateMethod(this, _MasField_instances, ensureContentElement_fn).call(this);
    this.aemFragment?.setAttribute("hidden", "");
    registerPriceOptionsProvider(getService());
  }
  /** Cleans up the event listener when removed from the DOM. */
  disconnectedCallback() {
    this.removeEventListener(EVENT_AEM_LOAD, __privateGet(this, _onFragmentLoad));
  }
  /** Resolves when the fragment data has loaded. Used by the autoblock timeout race. */
  checkReady() {
    if (__privateGet(this, _loaded)) return Promise.resolve(true);
    return new Promise((resolve) => {
      this.addEventListener(EVENT_AEM_LOAD, () => resolve(true), {
        once: true
      });
    });
  }
  get aemFragment() {
    return this.querySelector("aem-fragment");
  }
};
_field = new WeakMap();
_loaded = new WeakMap();
_fields = new WeakMap();
_contentElement = new WeakMap();
_onFragmentLoad = new WeakMap();
_MasField_instances = new WeakSet();
ensureContentElement_fn = function() {
  if (__privateGet(this, _contentElement)?.isConnected) return __privateGet(this, _contentElement);
  const existing = this.querySelector(
    ':scope > span[data-role="mas-field-content"]'
  );
  if (existing) {
    __privateSet(this, _contentElement, existing);
    return existing;
  }
  const content = document.createElement("span");
  content.setAttribute("data-role", "mas-field-content");
  this.append(content);
  __privateSet(this, _contentElement, content);
  return content;
};
normalizeFieldValue_fn = function(value) {
  if (value && typeof value === "object" && "value" in value)
    return value.value;
  return value;
};
/** Parses "ctas[0]" into { fieldName: "ctas", index: 0 }, or { fieldName, index: null } for plain names. */
parseFieldAndIndex_fn = function(field) {
  const match = field?.match(/^(.+)\[(.*?)\]$/);
  if (!match) return { fieldName: field, index: null };
  return { fieldName: match[1], index: match[2] };
};
/** Extracts the Nth anchor from CTA HTML, stripping only CSS classes so Milo can restyle it.
 *  Uses a <template> element so custom elements (e.g. checkout-link) are never upgraded
 *  and their attributes (href, data-wcs-osi, etc.) are preserved exactly as stored. */
extractIndexedAnchor_fn = function(html, index) {
  if (typeof html !== "string") return null;
  const template = document.createElement("template");
  template.innerHTML = html;
  let anchor;
  if (!isNaN(index)) {
    const i = parseInt(index, 10);
    anchor = [...template.content.querySelectorAll("a")][i - 1];
  }
  if (!anchor) {
    anchor = template.content.querySelector(`a[data-key="${index}"]`);
  }
  if (!anchor) return null;
  anchor.removeAttribute("class");
  return anchor.outerHTML;
};
setFragmentIds_fn = function() {
  if (!this.aemFragment) return;
  this.setAttribute("fragment-id", this.aemFragment.data?.id);
  const fragment = this.aemFragment.data;
  if (!fragment) return;
  if (fragment.variationId)
    this.setAttribute("variation-id", fragment.variationId);
  if (fragment.maskId) this.setAttribute("mask-id", fragment.maskId);
  if (fragment.promoProject)
    this.setAttribute("data-promotion-project", fragment.promoProject);
  if (fragment.promoVariationProject)
    this.setAttribute(
      "data-promotion-variation-project",
      fragment.promoVariationProject
    );
};
renderField_fn = function() {
  if (!__privateGet(this, _fields) || !__privateGet(this, _field)) return;
  const { fieldName, index } = __privateMethod(this, _MasField_instances, parseFieldAndIndex_fn).call(this, __privateGet(this, _field));
  const fieldValue = __privateMethod(this, _MasField_instances, normalizeFieldValue_fn).call(this, __privateGet(this, _fields)[fieldName]);
  if (fieldValue === void 0) return;
  __privateMethod(this, _MasField_instances, setFragmentIds_fn).call(this);
  const content = __privateMethod(this, _MasField_instances, ensureContentElement_fn).call(this);
  let html;
  if (index !== null) {
    html = __privateMethod(this, _MasField_instances, extractIndexedAnchor_fn).call(this, fieldValue, index);
    if (html === null) return;
  } else {
    html = __privateMethod(this, _MasField_instances, unwrapSingleParagraph_fn).call(this, fieldValue);
  }
  if (typeof html === "string") {
    if (__privateGet(this, _field) === "ctas") {
      const ctaEl = __privateMethod(this, _MasField_instances, renderCtaField_fn).call(this, html);
      if (ctaEl) {
        content.replaceChildren(ctaEl);
        return;
      }
    }
    content.innerHTML = html;
    return;
  }
  content.textContent = html == null ? "" : String(html);
};
/**
 * Converts a single CTA anchor from the AEM fragment into a checkout-button
 * (or styled anchor for non-commerce links) using the same Spectrum CSS
 * classes that merch-card hydration applies.
 */
buildCtaButton_fn = function(link) {
  const isCheckout = !!link.getAttribute("data-wcs-osi");
  if (!isCheckout) return link.cloneNode(true);
  const styleMatch = CHECKOUT_STYLE_PATTERN.exec(link.className ?? "")?.[0] ?? "accent";
  const isAccent = styleMatch.startsWith("accent");
  const isLinkStyle = styleMatch.includes("-link");
  const CheckoutLink = customElements.get("checkout-link");
  const button = CheckoutLink?.createCheckoutLink(link.dataset, link.textContent) ?? (() => {
    const el = document.createElement("a", { is: "checkout-link" });
    el.innerHTML = `<span style="pointer-events: none;">${link.textContent}</span>`;
    return el;
  })();
  for (const { name, value } of link.attributes) {
    if (["class", "is", "href"].includes(name)) continue;
    button.setAttribute(name, value);
  }
  button.firstElementChild?.classList.add("spectrum-Button-label");
  if (!isLinkStyle) {
    button.classList.add("button", "con-button");
    if (isAccent) button.classList.add("blue");
    else if (styleMatch.startsWith("primary") && !styleMatch.includes("-outline"))
      button.classList.add("fill");
  }
  return button;
};
/**
 * Parses the raw CTA field HTML, converts each anchor to a hydrated
 * checkout-button, and returns a <div slot="footer"> ready to render.
 * Returns null if there are no anchor elements in the field value.
 */
renderCtaField_fn = function(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const links = [...doc.body.querySelectorAll("a")];
  if (!links.length) return null;
  const footer = document.createElement("div");
  footer.setAttribute("slot", "footer");
  footer.append(...links.map((link) => __privateMethod(this, _MasField_instances, buildCtaButton_fn).call(this, link)));
  return footer;
};
/** Strips <p> wrapper from single-paragraph AEM rich text so it renders inline. */
unwrapSingleParagraph_fn = function(html) {
  if (typeof html !== "string") return html;
  const trimmed = html.trim();
  const hasWrapper = trimmed.startsWith("<p>") && trimmed.endsWith("</p>");
  if (!hasWrapper) return html;
  const inner = trimmed.slice("<p>".length, -"</p>".length);
  return inner.includes("<p>") ? html : inner;
};
customElements.define(MAS_FIELD_TAG, MasField);
export {
  priceOptionsProvider
};
//# sourceMappingURL=mas-field.js.map
