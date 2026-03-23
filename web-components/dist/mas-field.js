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

// src/mas-field.js
var MAS_FIELD_TAG = "mas-field";
var _field, _loaded, _fields, _contentElement, _onFragmentLoad, _MasField_instances, ensureContentElement_fn, normalizeFieldValue_fn, renderField_fn, unwrapSingleParagraph_fn;
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
renderField_fn = function() {
  if (!__privateGet(this, _fields) || !__privateGet(this, _field)) return;
  const fieldValue = __privateMethod(this, _MasField_instances, normalizeFieldValue_fn).call(this, __privateGet(this, _fields)[__privateGet(this, _field)]);
  if (fieldValue === void 0) return;
  const content = __privateMethod(this, _MasField_instances, ensureContentElement_fn).call(this);
  const html = __privateMethod(this, _MasField_instances, unwrapSingleParagraph_fn).call(this, fieldValue);
  if (typeof html === "string") {
    content.innerHTML = html;
    return;
  }
  content.textContent = html == null ? "" : String(html);
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
//# sourceMappingURL=mas-field.js.map
