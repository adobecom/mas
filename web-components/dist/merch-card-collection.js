var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/merch-card-collection.js
import { html as html12, LitElement, css as css9, unsafeCSS as unsafeCSS2, nothing as nothing3 } from "/deps/lit-all.min.js";

// src/media.js
var MOBILE_LANDSCAPE = "(max-width: 767px)";
var TABLET_DOWN = "(max-width: 1199px)";
var TABLET_UP = "(min-width: 768px)";
var DESKTOP_UP = "(min-width: 1200px)";
var LARGE_DESKTOP = "(min-width: 1600px)";
function matchMobile() {
  return window.matchMedia(MOBILE_LANDSCAPE);
}
function matchDesktop() {
  return window.matchMedia(DESKTOP_UP);
}
function isMobile() {
  return matchMobile().matches;
}
function isDesktop() {
  return matchDesktop().matches;
}

// node_modules/@spectrum-web-components/reactive-controllers/src/MatchMedia.js
var MatchMediaController = class {
  constructor(e, t) {
    this.key = Symbol("match-media-key");
    this.matches = false;
    this.host = e, this.host.addController(this), this.media = window.matchMedia(t), this.matches = this.media.matches, this.onChange = this.onChange.bind(this), e.addController(this);
  }
  hostConnected() {
    var e;
    (e = this.media) == null || e.addEventListener("change", this.onChange);
  }
  hostDisconnected() {
    var e;
    (e = this.media) == null || e.removeEventListener("change", this.onChange);
  }
  onChange(e) {
    this.matches !== e.matches && (this.matches = e.matches, this.host.requestUpdate(this.key, !this.matches));
  }
};

// src/deeplink.js
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

// src/constants.js
var constants_exports = {};
__export(constants_exports, {
  CLASS_NAME_FAILED: () => CLASS_NAME_FAILED,
  CLASS_NAME_HIDDEN: () => CLASS_NAME_HIDDEN,
  CLASS_NAME_PENDING: () => CLASS_NAME_PENDING,
  CLASS_NAME_RESOLVED: () => CLASS_NAME_RESOLVED,
  CheckoutWorkflow: () => CheckoutWorkflow,
  CheckoutWorkflowStep: () => CheckoutWorkflowStep,
  Commitment: () => Commitment,
  ERROR_MESSAGE_BAD_REQUEST: () => ERROR_MESSAGE_BAD_REQUEST,
  ERROR_MESSAGE_MISSING_LITERALS_URL: () => ERROR_MESSAGE_MISSING_LITERALS_URL,
  ERROR_MESSAGE_OFFER_NOT_FOUND: () => ERROR_MESSAGE_OFFER_NOT_FOUND,
  EVENT_AEM_ERROR: () => EVENT_AEM_ERROR,
  EVENT_AEM_LOAD: () => EVENT_AEM_LOAD,
  EVENT_MAS_ERROR: () => EVENT_MAS_ERROR,
  EVENT_MAS_READY: () => EVENT_MAS_READY,
  EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE: () => EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE,
  EVENT_MERCH_CARD_ACTION_MENU_TOGGLE: () => EVENT_MERCH_CARD_ACTION_MENU_TOGGLE,
  EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED: () => EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
  EVENT_MERCH_CARD_COLLECTION_SHOWMORE: () => EVENT_MERCH_CARD_COLLECTION_SHOWMORE,
  EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED: () => EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED,
  EVENT_MERCH_CARD_COLLECTION_SORT: () => EVENT_MERCH_CARD_COLLECTION_SORT,
  EVENT_MERCH_CARD_QUANTITY_CHANGE: () => EVENT_MERCH_CARD_QUANTITY_CHANGE,
  EVENT_MERCH_OFFER_READY: () => EVENT_MERCH_OFFER_READY,
  EVENT_MERCH_OFFER_SELECT_READY: () => EVENT_MERCH_OFFER_SELECT_READY,
  EVENT_MERCH_QUANTITY_SELECTOR_CHANGE: () => EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
  EVENT_MERCH_SEARCH_CHANGE: () => EVENT_MERCH_SEARCH_CHANGE,
  EVENT_MERCH_SIDENAV_SELECT: () => EVENT_MERCH_SIDENAV_SELECT,
  EVENT_MERCH_STOCK_CHANGE: () => EVENT_MERCH_STOCK_CHANGE,
  EVENT_MERCH_STORAGE_CHANGE: () => EVENT_MERCH_STORAGE_CHANGE,
  EVENT_OFFER_SELECTED: () => EVENT_OFFER_SELECTED,
  EVENT_TYPE_FAILED: () => EVENT_TYPE_FAILED,
  EVENT_TYPE_READY: () => EVENT_TYPE_READY,
  EVENT_TYPE_RESOLVED: () => EVENT_TYPE_RESOLVED,
  Env: () => Env,
  FF_DEFAULTS: () => FF_DEFAULTS,
  HEADER_X_REQUEST_ID: () => HEADER_X_REQUEST_ID,
  LOG_NAMESPACE: () => LOG_NAMESPACE,
  Landscape: () => Landscape,
  MARK_DURATION_SUFFIX: () => MARK_DURATION_SUFFIX,
  MARK_START_SUFFIX: () => MARK_START_SUFFIX,
  MODAL_TYPE_3_IN_1: () => MODAL_TYPE_3_IN_1,
  NAMESPACE: () => NAMESPACE,
  PARAM_AOS_API_KEY: () => PARAM_AOS_API_KEY,
  PARAM_ENV: () => PARAM_ENV,
  PARAM_LANDSCAPE: () => PARAM_LANDSCAPE,
  PARAM_MAS_PREVIEW: () => PARAM_MAS_PREVIEW,
  PARAM_WCS_API_KEY: () => PARAM_WCS_API_KEY,
  PROVIDER_ENVIRONMENT: () => PROVIDER_ENVIRONMENT,
  SELECTOR_MAS_CHECKOUT_LINK: () => SELECTOR_MAS_CHECKOUT_LINK,
  SELECTOR_MAS_ELEMENT: () => SELECTOR_MAS_ELEMENT,
  SELECTOR_MAS_INLINE_PRICE: () => SELECTOR_MAS_INLINE_PRICE,
  SELECTOR_MAS_SP_BUTTON: () => SELECTOR_MAS_SP_BUTTON,
  SELECTOR_MAS_UPT_LINK: () => SELECTOR_MAS_UPT_LINK,
  SORT_ORDER: () => SORT_ORDER,
  STATE_FAILED: () => STATE_FAILED,
  STATE_PENDING: () => STATE_PENDING,
  STATE_RESOLVED: () => STATE_RESOLVED,
  SUPPORTED_COUNTRIES: () => SUPPORTED_COUNTRIES,
  SUPPORTED_LANGUAGES: () => SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_COUNTRY: () => SUPPORTED_LANGUAGE_COUNTRY,
  TAG_NAME_SERVICE: () => TAG_NAME_SERVICE,
  TEMPLATE_PRICE: () => TEMPLATE_PRICE,
  TEMPLATE_PRICE_ANNUAL: () => TEMPLATE_PRICE_ANNUAL,
  TEMPLATE_PRICE_LEGAL: () => TEMPLATE_PRICE_LEGAL,
  TEMPLATE_PRICE_STRIKETHROUGH: () => TEMPLATE_PRICE_STRIKETHROUGH,
  Term: () => Term,
  WCS_PROD_URL: () => WCS_PROD_URL,
  WCS_STAGE_URL: () => WCS_STAGE_URL
});
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
var NAMESPACE = "merch";
var CLASS_NAME_HIDDEN = "hidden";
var EVENT_TYPE_READY = "wcms:commerce:ready";
var TAG_NAME_SERVICE = "mas-commerce-service";
var SELECTOR_MAS_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
var SELECTOR_MAS_CHECKOUT_LINK = 'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var SELECTOR_MAS_SP_BUTTON = "sp-button[data-wcs-osi]";
var SELECTOR_MAS_UPT_LINK = 'a[is="upt-link"]';
var SELECTOR_MAS_ELEMENT = `${SELECTOR_MAS_INLINE_PRICE},${SELECTOR_MAS_CHECKOUT_LINK},${SELECTOR_MAS_UPT_LINK}`;
var EVENT_MERCH_OFFER_READY = "merch-offer:ready";
var EVENT_MERCH_OFFER_SELECT_READY = "merch-offer-select:ready";
var EVENT_MERCH_CARD_ACTION_MENU_TOGGLE = "merch-card:action-menu-toggle";
var EVENT_OFFER_SELECTED = "merch-offer:selected";
var EVENT_MERCH_STOCK_CHANGE = "merch-stock:change";
var EVENT_MERCH_STORAGE_CHANGE = "merch-storage:change";
var EVENT_MERCH_QUANTITY_SELECTOR_CHANGE = "merch-quantity-selector:change";
var EVENT_MERCH_CARD_QUANTITY_CHANGE = "merch-card-quantity:change";
var EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE = "merch-modal:addon-and-quantity-update";
var EVENT_MERCH_SEARCH_CHANGE = "merch-search:change";
var EVENT_MERCH_CARD_COLLECTION_SORT = "merch-card-collection:sort";
var EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED = "merch-card-collection:literals-changed";
var EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED = "merch-card-collection:sidenav-attached";
var EVENT_MERCH_CARD_COLLECTION_SHOWMORE = "merch-card-collection:showmore";
var EVENT_MERCH_SIDENAV_SELECT = "merch-sidenav:select";
var EVENT_AEM_LOAD = "aem:load";
var EVENT_AEM_ERROR = "aem:error";
var EVENT_MAS_READY = "mas:ready";
var EVENT_MAS_ERROR = "mas:error";
var CLASS_NAME_FAILED = "placeholder-failed";
var CLASS_NAME_PENDING = "placeholder-pending";
var CLASS_NAME_RESOLVED = "placeholder-resolved";
var ERROR_MESSAGE_BAD_REQUEST = "Bad WCS request";
var ERROR_MESSAGE_OFFER_NOT_FOUND = "Commerce offer not found";
var ERROR_MESSAGE_MISSING_LITERALS_URL = "Literals URL not provided";
var EVENT_TYPE_FAILED = "mas:failed";
var EVENT_TYPE_RESOLVED = "mas:resolved";
var LOG_NAMESPACE = "mas/commerce";
var PARAM_MAS_PREVIEW = "mas.preview";
var PARAM_ENV = "commerce.env";
var PARAM_LANDSCAPE = "commerce.landscape";
var PARAM_AOS_API_KEY = "commerce.aosKey";
var PARAM_WCS_API_KEY = "commerce.wcsKey";
var WCS_PROD_URL = "https://www.adobe.com/web_commerce_artifact";
var WCS_STAGE_URL = "https://www.stage.adobe.com/web_commerce_artifact_stage";
var STATE_FAILED = "failed";
var STATE_PENDING = "pending";
var STATE_RESOLVED = "resolved";
var Landscape = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED"
};
var HEADER_X_REQUEST_ID = "X-Request-Id";
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
var CheckoutWorkflow = "UCv3";
var Env = Object.freeze({
  STAGE: "STAGE",
  PRODUCTION: "PRODUCTION",
  LOCAL: "LOCAL"
});
var PROVIDER_ENVIRONMENT = {
  PRODUCTION: "PRODUCTION"
};
var MODAL_TYPE_3_IN_1 = {
  TWP: "twp",
  D2P: "d2p",
  CRM: "crm"
};
var MARK_START_SUFFIX = ":start";
var MARK_DURATION_SUFFIX = ":duration";
var TEMPLATE_PRICE = "price";
var TEMPLATE_PRICE_STRIKETHROUGH = "price-strikethrough";
var TEMPLATE_PRICE_ANNUAL = "annual";
var TEMPLATE_PRICE_LEGAL = "legal";
var FF_DEFAULTS = "mas-ff-defaults";
var SORT_ORDER = {
  alphabetical: "alphabetical",
  authored: "authored"
};
var SUPPORTED_LANGUAGE_COUNTRY = [
  "en_US",
  "ar_DZ",
  "ar_EG",
  "ar_SA",
  "bg_BG",
  "cs_CZ",
  "da_DK",
  "de_AT",
  "de_CH",
  "de_DE",
  "de_LU",
  "el_GR",
  "en_AU",
  "en_AZ",
  "en_BE",
  "en_CA",
  "en_DZ",
  "en_EG",
  "en_GB",
  "en_GR",
  "en_ID",
  "en_IE",
  "en_IN",
  "en_LU",
  "en_MT",
  "en_MU",
  "en_MY",
  "en_NG",
  "en_NZ",
  "en_SA",
  "en_SG",
  "en_TH",
  "en_ZA",
  "es_AR",
  "es_CL",
  "es_CO",
  "es_CR",
  "es_DO",
  "es_EC",
  "es_ES",
  "es_GT",
  "es_MX",
  "es_PE",
  "es_US",
  "et_EE",
  "fi_FI",
  "fr_BE",
  "fr_CH",
  "fr_FR",
  "fr_LU",
  "hi_IN",
  "hu_HU",
  "in_ID",
  "it_CH",
  "it_IT",
  "iw_IL",
  "ja_JP",
  "ko_KR",
  "lt_LT",
  "lv_LV",
  "ms_MY",
  "nb_NO",
  "nl_BE",
  "nl_NL",
  "pl_PL",
  "pt_BR",
  "pt_PT",
  "ro_RO",
  "ru_AZ",
  "ru_RU",
  "sk_SK",
  "sl_SI",
  "sv_SE",
  "th_TH",
  "tr_TR",
  "uk_UA",
  "zh-Hans_CN",
  "zh-Hant_HK",
  "zh-Hant_TW"
];
var SUPPORTED_LANGUAGES = [
  "en",
  "ar",
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "et",
  "fi",
  "fr",
  "hi",
  "hu",
  "in",
  "it",
  "iw",
  "ja",
  "ko",
  "lt",
  "lv",
  "ms",
  "nb",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sl",
  "sv",
  "th",
  "tr",
  "uk",
  "zh-Hans",
  "zh-Hant",
  "fr-ca",
  "he",
  "no",
  "zh-hant",
  "fil",
  "id",
  "vi",
  "en-gb",
  "es-419"
];
var SUPPORTED_COUNTRIES = [
  "AE",
  "AR",
  "AT",
  "AU",
  "AZ",
  "BE",
  "BG",
  "BR",
  "CA",
  "CH",
  "CL",
  "CN",
  "CO",
  "CR",
  "CY",
  "CZ",
  "DE",
  "DK",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "ES",
  "FI",
  "FR",
  "GB",
  "GE",
  "GR",
  "GT",
  "HK",
  "HU",
  "ID",
  "IE",
  "IL",
  "IN",
  "IT",
  "JP",
  "KR",
  "KW",
  "LA",
  "LT",
  "LU",
  "LV",
  "MT",
  "MU",
  "MX",
  "MY",
  "NG",
  "NL",
  "NO",
  "NZ",
  "PE",
  "PH",
  "PL",
  "PR",
  "PT",
  "QA",
  "RO",
  "RU",
  "SA",
  "SE",
  "SG",
  "SI",
  "SK",
  "TH",
  "TR",
  "TW",
  "UA",
  "US",
  "VN",
  "ZA"
];

// src/utils.js
var MAS_COMMERCE_SERVICE = "mas-commerce-service";
var getSlotText = (element, name) => element?.querySelector(`[slot="${name}"]`)?.textContent?.trim();
function createTag(tag, attributes = {}, content = null, is = null) {
  const element = is ? document.createElement(tag, { is }) : document.createElement(tag);
  if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else {
    element.innerHTML = content;
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}
function printMeasure(measure) {
  return `startTime:${measure.startTime.toFixed(2)}|duration:${measure.duration.toFixed(2)}`;
}
function isMobileOrTablet() {
  return window.matchMedia("(max-width: 1024px)").matches;
}
function getService() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}
function getOuterHeight(element) {
  const style = window.getComputedStyle(element);
  return element.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}

// src/variants/variant-layout.js
import { html, nothing } from "/deps/lit-all.min.js";
var _container;
var _VariantLayout = class _VariantLayout {
  constructor(card) {
    __publicField(this, "card");
    __privateAdd(this, _container);
    this.card = card;
    this.insertVariantStyle();
  }
  getContainer() {
    __privateSet(this, _container, __privateGet(this, _container) ?? this.card.closest('[class*="-merch-cards"]') ?? this.card.parentElement);
    return __privateGet(this, _container);
  }
  insertVariantStyle() {
    if (!_VariantLayout.styleMap[this.card.variant]) {
      _VariantLayout.styleMap[this.card.variant] = true;
      const styles = document.createElement("style");
      styles.innerHTML = this.getGlobalCSS();
      document.head.appendChild(styles);
    }
  }
  updateCardElementMinHeight(el, name) {
    if (!el) return;
    const elMinHeightPropertyName = `--consonant-merch-card-${this.card.variant}-${name}-height`;
    const height = Math.max(
      0,
      parseInt(window.getComputedStyle(el).height) || 0
    );
    const maxMinHeight = parseInt(
      this.getContainer().style.getPropertyValue(
        elMinHeightPropertyName
      )
    ) || 0;
    if (height > maxMinHeight) {
      this.getContainer().style.setProperty(
        elMinHeightPropertyName,
        `${height}px`
      );
    }
  }
  get badge() {
    let additionalStyles;
    if (!this.card.badgeBackgroundColor || !this.card.badgeColor || !this.card.badgeText) {
      return;
    }
    if (this.evergreen) {
      additionalStyles = `border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`;
    }
    return html`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${additionalStyles}"
            >
                ${this.card.badgeText}
            </div>
        `;
  }
  get cardImage() {
    return html` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`;
  }
  /* c8 ignore next 3 */
  getGlobalCSS() {
    return "";
  }
  /* c8 ignore next 3 */
  get theme() {
    return document.querySelector("sp-theme");
  }
  get evergreen() {
    return this.card.classList.contains("intro-pricing");
  }
  get promoBottom() {
    return this.card.classList.contains("promo-bottom");
  }
  get headingSelector() {
    return '[slot="heading-xs"]';
  }
  get secureLabel() {
    return this.card.secureLabel ? html`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >` : nothing;
  }
  get secureLabelFooter() {
    return html`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`;
  }
  async adjustTitleWidth() {
    const cardWidth = this.card.getBoundingClientRect().width;
    const badgeWidth = this.card.badgeElement?.getBoundingClientRect().width || 0;
    if (cardWidth === 0 || badgeWidth === 0) return;
    this.card.style.setProperty(
      "--consonant-merch-card-heading-xs-max-width",
      `${Math.round(cardWidth - badgeWidth - 16)}px`
      // consonant-merch-spacing-xs
    );
  }
  async postCardUpdateHook() {
  }
  connectedCallbackHook() {
  }
  disconnectedCallbackHook() {
  }
  /* c8 ignore next 3 */
  renderLayout() {
  }
  get aemFragmentMapping() {
    return getFragmentMapping(this.card.variant);
  }
};
_container = new WeakMap();
__publicField(_VariantLayout, "styleMap", {});
var VariantLayout = _VariantLayout;

// src/variants/catalog.js
import { html as html2, css } from "/deps/lit-all.min.js";

// src/variants/catalog.css.js
var CSS = `
:root {
    --consonant-merch-card-catalog-width: 302px;
    --consonant-merch-card-catalog-icon-size: 40px;
}

.collection-container.catalog {
    --merch-card-collection-card-min-height: 330px;
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

merch-sidenav.catalog {
    --merch-sidenav-title-font-size: 15px;
    --merch-sidenav-title-font-weight: 500;
    --merch-sidenav-title-line-height: 19px;
    --merch-sidenav-title-color: rgba(70, 70, 70, 0.87);
    --merch-sidenav-title-padding: 8px 15px 21px;
    --merch-sidenav-item-height: 40px;
    --merch-sidenav-item-inline-padding: 15px;
    --merch-sidenav-item-font-weight: 700;
    --merch-sidenav-item-font-size: 17px;
    --merch-sidenav-item-line-height: normal;
    --merch-sidenav-item-label-top-margin: 8px;
    --merch-sidenav-item-label-bottom-margin: 11px;
    --merch-sidenav-item-icon-top-margin: 11px;
    --merch-sidenav-item-icon-gap: 13px;
    --merch-sidenav-item-selected-background: var(--spectrum-gray-300, #D5D5D5);
    --merch-sidenav-list-item-gap: 5px;
    --merch-sidenav-checkbox-group-padding: 0 15px;
    --merch-sidenav-modal-border-radius: 0;
}

merch-sidenav.catalog merch-sidenav-checkbox-group {
    border: none;
}

merch-sidenav.catalog merch-sidenav-list:not(:first-of-type) {
    --merch-sidenav-list-gap: 32px;
}

.one-merch-card.catalog,
.two-merch-cards.catalog,
.three-merch-cards.catalog,
.four-merch-cards.catalog {
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

.collection-container.catalog merch-sidenav {
    --merch-sidenav-gap: 10px;
}

merch-card-collection-header.catalog {
    --merch-card-collection-header-row-gap: var(--consonant-merch-spacing-xs);
    --merch-card-collection-header-search-max-width: 244px;
}

@media screen and ${MOBILE_LANDSCAPE} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${TABLET_UP} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-column-gap: 16px;
    }
}

@media screen and ${DESKTOP_UP} {
    :root {
        --consonant-merch-card-catalog-width: 276px;
    }

    merch-card-collection-header.catalog {
        --merch-card-collection-header-result-font-size: 17px;
    }
}

merch-card[variant="catalog"] [slot="action-menu-content"] {
  background-color: #000;
  color: var(--color-white, #fff);
  font-size: var(--consonant-merch-card-body-xs-font-size);
  width: fit-content;
  padding: var(--consonant-merch-spacing-xs);
  border-radius: var(--consonant-merch-spacing-xxxs);
  position: absolute;
  top: 55px;
  right: 15px;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul {
  padding-left: 0;
  padding-bottom: var(--consonant-merch-spacing-xss);
  margin-top: 0;
  margin-bottom: 0;
  list-style-position: inside;
  list-style-type: '\u2022 ';
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul li {
  padding-left: 0;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="action-menu-content"] ::marker {
  margin-right: 0;
}

merch-card[variant="catalog"] [slot="action-menu-content"] p {
  color: var(--color-white, #fff);
}

merch-card[variant="catalog"] [slot="action-menu-content"] a {
  color: var(--consonant-merch-card-background-color);
  text-decoration: underline;
}

merch-card[variant="catalog"] .payment-details {
  font-size: var(--consonant-merch-card-body-font-size);
  font-style: italic;
  font-weight: 400;
  line-height: var(--consonant-merch-card-body-line-height);
}`;

// src/variants/catalog.js
var CATALOG_AEM_FRAGMENT_MAPPING = {
  badge: true,
  ctas: { slot: "footer", size: "m" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  prices: { tag: "h3", slot: "heading-xs" },
  size: ["wide", "super-wide"],
  title: { tag: "h3", slot: "heading-xs" }
};
var Catalog = class extends VariantLayout {
  constructor(card) {
    super(card);
    __publicField(this, "dispatchActionMenuToggle", () => {
      this.card.dispatchEvent(
        new CustomEvent(EVENT_MERCH_CARD_ACTION_MENU_TOGGLE, {
          bubbles: true,
          composed: true,
          detail: {
            card: this.card.name,
            type: "action-menu"
          }
        })
      );
    });
    __publicField(this, "toggleActionMenu", (e) => {
      if (!this.actionMenuContentSlot || !e || e.type !== "click" && e.code !== "Space" && e.code !== "Enter")
        return;
      e.preventDefault();
      this.actionMenuContentSlot.classList.toggle("hidden");
      const isHidden = this.actionMenuContentSlot.classList.contains("hidden");
      if (!isHidden) this.dispatchActionMenuToggle();
      this.setAriaExpanded(this.actionMenu, (!isHidden).toString());
    });
    __publicField(this, "toggleActionMenuFromCard", (e) => {
      const retract = e?.type === "mouseleave" ? true : void 0;
      this.card.blur();
      this.actionMenu?.classList.remove("always-visible");
      if (!this.actionMenuContentSlot) return;
      if (!retract) this.dispatchActionMenuToggle();
      this.actionMenuContentSlot.classList.toggle("hidden", retract);
      this.setAriaExpanded(this.actionMenu, "false");
    });
    __publicField(this, "hideActionMenu", (e) => {
      this.actionMenuContentSlot?.classList.add("hidden");
      this.setAriaExpanded(this.actionMenu, "false");
    });
  }
  get actionMenu() {
    return this.card.shadowRoot.querySelector(".action-menu");
  }
  get actionMenuContentSlot() {
    return this.card.shadowRoot.querySelector(
      'slot[name="action-menu-content"]'
    );
  }
  renderLayout() {
    return html2` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${isMobileOrTablet() && this.card.actionMenu ? "always-visible" : ""}
                ${!this.card.actionMenu ? "hidden" : "invisible"}"
                        @click="${this.toggleActionMenu}"
                        @keypress="${this.toggleActionMenu}"
                        tabindex="0"
                        aria-expanded="false"
                        role="button"
                    >
                        ${this.card.actionMenuLabel} - ${this.card.title}
                    </div>
                </div>
                <slot
                    name="action-menu-content"
                    class="action-menu-content
            ${!this.card.actionMenuContent ? "hidden" : ""}"
                    @focusout="${this.hideActionMenu}"
                    >${this.card.actionMenuContent}
                </slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-m"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html2`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html2`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
  }
  getGlobalCSS() {
    return CSS;
  }
  setAriaExpanded(element, value) {
    element.setAttribute("aria-expanded", value);
  }
  connectedCallbackHook() {
    this.card.addEventListener("mouseleave", this.toggleActionMenuFromCard);
  }
  disconnectedCallbackHook() {
    this.card.removeEventListener(
      "mouseleave",
      this.toggleActionMenuFromCard
    );
  }
};
__publicField(Catalog, "variantStyle", css`
        :host([variant='catalog']) {
            min-height: 330px;
            width: var(--consonant-merch-card-catalog-width);
        }

        .body .catalog-badge {
            display: flex;
            height: fit-content;
            flex-direction: column;
            width: fit-content;
            max-width: 140px;
            border-radius: 5px;
            position: relative;
            top: 0;
            margin-left: var(--consonant-merch-spacing-xxs);
            box-sizing: border-box;
        }
    `);

// src/variants/image.js
import { html as html3 } from "/deps/lit-all.min.js";

// src/variants/image.css.js
var CSS2 = `
:root {
  --consonant-merch-card-image-width: 300px;
}

.one-merch-card.image,
.two-merch-cards.image,
.three-merch-cards.image,
.four-merch-cards.image {
  grid-template-columns: var(--consonant-merch-card-image-width);
}

@media screen and ${TABLET_UP} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image {
      grid-template-columns: repeat(2, var(--consonant-merch-card-image-width));
  }
}

@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-image-width: 378px;
    --consonant-merch-card-image-width-4clm: 276px;
  }
    
  .three-merch-cards.image {
      grid-template-columns: repeat(3, var(--consonant-merch-card-image-width));
  }

  .four-merch-cards.image {
      grid-template-columns: repeat(4, var(--consonant-merch-card-image-width-4clm));
  }
}
`;

// src/variants/image.js
var Image = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS2;
  }
  renderLayout() {
    return html3`${this.cardImage}
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom ? html3`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>` : html3`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen ? html3`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card["detailBg"]}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  ` : html3`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`;
  }
};

// src/variants/inline-heading.js
import { html as html4 } from "/deps/lit-all.min.js";

// src/variants/inline-heading.css.js
var CSS3 = `
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

@media screen and ${TABLET_UP} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-inline-heading-width: 378px;
  }

  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(3, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;

// src/variants/inline-heading.js
var InlineHeading = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS3;
  }
  renderLayout() {
    return html4` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${!this.card.customHr ? html4`<hr />` : ""} ${this.secureLabelFooter}`;
  }
};

// src/variants/mini-compare-chart.js
import { html as html5, css as css2, unsafeCSS } from "/deps/lit-all.min.js";

// src/variants/mini-compare-chart.css.js
var CSS4 = `
  :root {
    --consonant-merch-card-mini-compare-chart-icon-size: 32px;
    --consonant-merch-card-mini-compare-border-color: #E9E9E9;
    --consonant-merch-card-mini-compare-mobile-cta-font-size: 16px;
    --consonant-merch-card-mini-compare-mobile-cta-width: 75px;
    --consonant-merch-card-mini-compare-badge-mobile-max-width: 50px;
    --consonant-merch-card-mini-compare-mobile-price-font-size: 32px;
    --consonant-merch-card-card-mini-compare-mobile-background-color: #F8F8F8;
    --consonant-merch-card-card-mini-compare-mobile-spacing-xs: 12px;
  }
  
  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    padding-left: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 8px;
    border-radius: .5rem;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart"] [is="inline-price"] {
    display: inline-block;
    min-height: 30px;
    min-width: 1px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;    
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] a {
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart"] .action-area {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart"] [slot="footer-rows"] ul {
    margin-block-start: 0px;
    margin-block-end: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-color: var(--merch-color-grey-60);
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart"] .toggle-icon {
    display: flex;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: inherit;
    font: inherit;
    border-radius: 0;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container.open {
    display: block;
    padding-block-start: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs);
    padding-block-end: 4px;
  }
  
.one-merch-card.mini-compare-chart {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart,
.three-merch-cards.mini-compare-chart,
.four-merch-cards.mini-compare-chart {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* bullet list */
merch-card[variant="mini-compare-chart"].bullet-list {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list:not(.badge-card):not(.mini-compare-chart-badge) {
  border-color: var(--consonant-merch-card-mini-compare-border-color);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-heading-xxs-font-size);
  line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: 0 var(--consonant-merch-spacing-xs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual, .price-annual-prefix::after, .price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list footer {
  gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list .action-area {
  justify-content: flex-start;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
  background-color: var(--consonant-merch-card-card-mini-compare-mobile-background-color);
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

/* mini compare mobile */ 
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }
  
  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${TABLET_DOWN} {
  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }
  
  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }
}
@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart {
      grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
  }

   merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 378px;
    --consonant-merch-card-mini-compare-chart-wide-width: 484px;  
  }
  .one-merch-card.mini-compare-chart {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  }

  .two-merch-cards.mini-compare-chart {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-width));
    gap: var(--consonant-merch-spacing-m);
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.mini-compare-chart {
      grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-width));
  }
}

merch-card[variant="mini-compare-chart"].bullet-list div[slot="footer-rows"]  {
  height: 100%;
}

merch-card .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;

// src/variants/mini-compare-chart.js
var FOOTER_ROW_MIN_HEIGHT = 32;
var MiniCompareChart = class extends VariantLayout {
  constructor(card) {
    super(card);
    __publicField(this, "getRowMinHeightPropertyName", (index) => `--consonant-merch-card-footer-row-${index}-min-height`);
    __publicField(this, "getMiniCompareFooter", () => {
      const secureLabel = this.card.secureLabel ? html5`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >` : html5`<slot name="secure-transaction-label"></slot>`;
      return html5`<footer>${secureLabel}<slot name="footer"></slot></footer>`;
    });
  }
  getGlobalCSS() {
    return CSS4;
  }
  adjustMiniCompareBodySlots() {
    if (this.card.getBoundingClientRect().width <= 2) return;
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector(".top-section"),
      "top-section"
    );
    let slots = [
      "heading-m",
      "body-m",
      "heading-m-price",
      "body-xxs",
      "price-commitment",
      "offers",
      "promo-text",
      "callout-content"
    ];
    if (this.card.classList.contains("bullet-list")) {
      slots.push("footer-rows");
    }
    slots.forEach(
      (slot) => this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
        slot
      )
    );
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector("footer"),
      "footer"
    );
    const badge = this.card.shadowRoot.querySelector(
      ".mini-compare-chart-badge"
    );
    if (badge?.textContent !== "") {
      this.getContainer().style.setProperty(
        "--consonant-merch-card-mini-compare-chart-top-section-mobile-height",
        "32px"
      );
    }
  }
  adjustMiniCompareFooterRows() {
    if (this.card.getBoundingClientRect().width === 0) return;
    const footerRows = this.card.querySelector('[slot="footer-rows"] ul');
    if (!footerRows || !footerRows.children) return;
    [...footerRows.children].forEach((el, index) => {
      const height = Math.max(
        FOOTER_ROW_MIN_HEIGHT,
        parseFloat(window.getComputedStyle(el).height) || 0
      );
      const maxMinHeight = parseFloat(
        this.getContainer().style.getPropertyValue(
          this.getRowMinHeightPropertyName(index + 1)
        )
      ) || 0;
      if (height > maxMinHeight) {
        this.getContainer().style.setProperty(
          this.getRowMinHeightPropertyName(index + 1),
          `${height}px`
        );
      }
    });
  }
  removeEmptyRows() {
    const footerRows = this.card.querySelectorAll(".footer-row-cell");
    footerRows.forEach((row) => {
      const rowDescription = row.querySelector(
        ".footer-row-cell-description"
      );
      if (rowDescription) {
        const isEmpty = !rowDescription.textContent.trim();
        if (isEmpty) {
          row.remove();
        }
      }
    });
  }
  get mainPrice() {
    const price2 = this.card.querySelector(
      `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price2;
  }
  get headingMPriceSlot() {
    return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0];
  }
  toggleAddon(merchAddon) {
    const mainPrice = this.mainPrice;
    const headingMPriceSlot = this.headingMPriceSlot;
    if (!mainPrice && headingMPriceSlot) {
      const planType = merchAddon?.getAttribute("plan-type");
      let visibleSpan = null;
      if (merchAddon && planType) {
        const matchingP = merchAddon.querySelector(
          `p[data-plan-type="${planType}"]`
        );
        visibleSpan = matchingP?.querySelector(
          'span[is="inline-price"]'
        );
      }
      this.card.querySelectorAll('p[slot="heading-m-price"]').forEach((p) => p.remove());
      if (merchAddon.checked) {
        if (visibleSpan) {
          const replacementP = createTag(
            "p",
            {
              class: "addon-heading-m-price-addon",
              slot: "heading-m-price"
            },
            visibleSpan.innerHTML
          );
          this.card.appendChild(replacementP);
        }
      } else {
        const freeP = createTag(
          "p",
          {
            class: "card-heading",
            id: "free",
            slot: "heading-m-price"
          },
          "Free"
        );
        this.card.appendChild(freeP);
      }
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    const price2 = this.mainPrice;
    let planType = this.card.planType;
    if (price2) {
      await price2.onceSettled();
      planType = price2.value?.[0]?.planType;
    }
    if (!planType) return;
    addon.planType = planType;
    const addonWithPlanType = this.card.querySelector(
      "merch-addon[plan-type]"
    );
    addonWithPlanType?.updateComplete.then(() => {
      this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="addon"]`),
        "addon"
      );
    });
  }
  renderLayout() {
    return html5` <div class="top-section${this.badge ? " badge" : ""}">
                <slot name="icons"></slot> ${this.badge}
            </div>
            <slot name="heading-m"></slot>
            ${this.card.classList.contains("bullet-list") ? html5`<slot name="heading-m-price"></slot>
                      <slot name="price-commitment"></slot>
                      <slot name="body-xxs"></slot>
                      <slot name="promo-text"></slot>
                      <slot name="body-m"></slot>
                      <slot name="offers"></slot>` : html5`<slot name="body-m"></slot>
                      <slot name="heading-m-price"></slot>
                      <slot name="body-xxs"></slot>
                      <slot name="price-commitment"></slot>
                      <slot name="offers"></slot>
                      <slot name="promo-text"></slot> `}
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
  }
  async postCardUpdateHook() {
    await Promise.all(this.card.prices.map((price2) => price2.onceSettled()));
    await this.adjustAddon();
    if (isMobile()) {
      this.removeEmptyRows();
    } else {
      this.adjustMiniCompareBodySlots();
      this.adjustMiniCompareFooterRows();
    }
  }
};
__publicField(MiniCompareChart, "variantStyle", css2`
        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .mini-compare-chart-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            font-weight: 400;
            color: #505050;
        }

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']:not(.bullet-list))
            slot[name='footer-rows'] {
            justify-content: flex-start;
        }
    `);

// src/variants/plans.js
import { html as html6, css as css3, nothing as nothing2 } from "/deps/lit-all.min.js";

// src/variants/plans.css.js
var CSS5 = `
:root {
    --consonant-merch-card-plans-width: 302px;
    --consonant-merch-card-plans-icon-size: 40px;
    --consonant-merch-card-plans-students-width: 568px;
}

merch-card[variant^="plans"] {
    --merch-card-plans-heading-xs-min-height: 23px;
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-plans-width);
}

merch-card[variant^="plans"][size="wide"], merch-card[variant^="plans"][size="super-wide"] {
    width: auto;
}

merch-card[variant="plans-students"] {
    width: 100%;
}

merch-card[variant^="plans"] [slot="icons"] {
    --img-width: 41.5px;
}

merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-legal) {
    display: inline-block;
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    font-weight: 700;
}

merch-card[variant="plans"] [slot="subtitle"] {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant^="plans"] span.price-unit-type {
    display: block;
}

merch-card[variant^="plans"] .price-unit-type:not(.disabled)::before {
    content: "";
}
merch-card[variant^="plans"] [slot="callout-content"] span.price-unit-type,
merch-card[variant^="plans"] [slot="addon"] span.price-unit-type,
merch-card[variant^="plans"] .price.price-strikethrough span.price-unit-type,
merch-card[variant^="plans"] span.price-unit-type.disabled {
  display: inline; 
}
  
merch-card[variant^="plans"] [slot="heading-xs"] span.price.price-strikethrough,
merch-card[variant^="plans"] [slot="heading-m"] span.price.price-strikethrough,
merch-card[variant="plans-education"] [slot="body-xs"] span.price.price-strikethrough {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 700;
}

merch-card[variant^="plans"] [slot='heading-xs'],
merch-card[variant="plans-education"] span.heading-xs,
merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-strikethrough) {
    min-height: var(--merch-card-plans-heading-xs-min-height);
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(.heading-xs) {
    margin-bottom: 16x;
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(span[is="inline-price"]) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] span.text-l {
    display: block;
    font-size: 18px;
    line-height: 23px;
}

merch-card[variant="plans-education"] span.promo-text {
    margin-bottom: 8px;
}

merch-card[variant="plans-education"] p:has(a[href^='tel:']):has(+ p, + div) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] [slot="promo-text"],
merch-card[variant="plans-education"] span.promo-text {
    line-height: var(--consonant-merch-card-body-xs-line-height);
}

merch-card[variant="plans-education"] [slot="body-xs"] {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

merch-card[variant="plans-education"] .spacer {
    height: calc(var(--merch-card-plans-edu-list-max-offset) - var(--merch-card-plans-edu-list-offset));
}

merch-card[variant="plans-education"] ul + p {
    margin-top: 16px;
}

merch-card-collection.plans merch-card {
    width: auto;
    height: 100%;
}

merch-card-collection.plans merch-card[variant="plans"] aem-fragment + [slot^="heading-"] {
    margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
}

merch-card[variant^='plans'] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant^='plans'] span.price-legal::first-letter {
    text-transform: uppercase;
}

merch-card[variant^='plans'] span.price-legal .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant^="plans"] [slot="description"] {
    min-height: 84px;
}

merch-card[variant^="plans"] [slot="body-xs"] a {
    color: var(--link-color);
}

merch-card[variant^="plans"] [slot="promo-text"] a {
    color: inherit;
}

merch-card[variant^="plans"] [slot="callout-content"] {
    margin: 8px 0 0;
}

merch-card[variant^="plans"][size="super-wide"] [slot="callout-content"] {
    margin: 0;
}

merch-card[variant^="plans"] [slot='callout-content'] > div > div,
merch-card[variant^="plans"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
}

merch-card[variant^="plans"] [slot="callout-content"] > p:has(> .icon-button) {
    padding-right: 36px;
}

merch-card[variant^="plans"] [slot='callout-content'] > p,
merch-card[variant^="plans"] [slot='callout-content'] > div > div > div {
    color: #000;
}

merch-card[variant^="plans"] [slot="callout-content"] img,
merch-card[variant^="plans"] [slot="callout-content"] .icon-button {
    margin: 1.5px 0 1.5px 8px;
}

merch-card[variant^="plans"] [slot="whats-included"] [slot="description"] {
  min-height: auto;
}

merch-card[variant^="plans"] [slot="quantity-select"] {
    margin-top: auto;
    padding-top: 8px;
}

merch-card[variant^="plans"]:has([slot="quantity-select"]) merch-addon {
    margin: 0;
}

merch-card[variant^="plans"] merch-addon {
    --merch-addon-gap: 10px;
    --merch-addon-align: center;
    --merch-addon-checkbox-size: 12px;
    --merch-addon-checkbox-border: 2px solid rgb(109, 109, 109);
    --merch-addon-checkbox-radius: 2px;
    --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
    --merch-addon-checkbox-checked-color: var(--color-accent);
    --merch-addon-label-size: 12px;
    --merch-addon-label-color: rgb(34, 34, 34);
    --merch-addon-label-line-height: normal;
}

merch-card[variant^="plans"] [slot="footer"] a {
    line-height: 19px;
    padding: 3px 16px 4px;
}

merch-card[variant^="plans"] [slot="footer"] .con-button > span {
    min-width: unset;
}

merch-card[variant^="plans"] merch-addon span[data-template="price"] {
    display: none;
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
    merch-card[variant="plans-students"] {
        min-width: var(--consonant-merch-card-plans-width);
        max-width: var(--consonant-merch-card-plans-students-width);
        width: 100%;
    }
    merch-card[variant="plans-education"] .spacer {
        height: 0px;
    }
}

merch-card[variant^="plans"]:not([size]) {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

.collection-container.plans {
    --merch-card-collection-card-min-height: 273px;
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-sidenav.plans {
    --merch-sidenav-padding: 16px 20px 16px 16px;
}

merch-card-collection-header.plans {
    --merch-card-collection-header-columns: 1fr fit-content(100%);
    --merch-card-collection-header-areas: "result filter";
}

.one-merch-card.plans,
.two-merch-cards.plans,
.three-merch-cards.plans,
.four-merch-cards.plans {
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-card-collection:has([slot="subtitle"]) merch-card {
    --merch-card-plans-subtitle-display: block;
}

.columns .text .foreground {
    margin: 0;
}

.columns.merch-card > .row {
    grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-plans-width));
    justify-content: center;
    align-items: center;
}

.columns.checkmark-list ul {
    padding-left: 20px;
    list-style-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 18 18" height="18px"><path fill="currentcolor" d="M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z"></path></svg>');
}

.columns.checkmark-list ul li {
    padding-left: 8px;
}

/* Tabs containers */

#tabs-plan {
    --tabs-active-text-color: #131313;
    --tabs-border-color: #444444;
}
#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"] {
    border-top-color: #EAEAEA;
    border-right-color: #EAEAEA;
}
#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"]:first-of-type {
    border-left-color: #EAEAEA;
}

/* Tablet */
@media screen and ${TABLET_UP} {
    .four-merch-cards.plans .foreground {
        max-width: unset;
    }

    .columns.merch-card > .row {
        grid-template-columns: repeat(auto-fit, calc(var(--consonant-merch-card-plans-width) * 2 + var(--consonant-merch-spacing-m)));
    }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
    :root {
        --consonant-merch-card-plans-width: 276px;
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 30px;
    }

    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-card[variant="plans-students"] {
        width: var(--consonant-merch-card-plans-students-width);
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: fit-content(100%);
        --merch-card-collection-header-areas: "custom";
    }

    .collection-container.plans:has(merch-sidenav) {
        width: fit-content;
        position: relative;
        left: 50%;
        transform: translateX(-50vw);
        justify-content: start;
        padding-inline: 30px;
        padding-top: 24px;
    }
}

/* Large desktop */
@media screen and ${LARGE_DESKTOP} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;

// src/variants/plans.js
var PLANS_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "subtitle" },
  prices: { tag: "p", slot: "heading-m" },
  promoText: { tag: "p", slot: "promo-text" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  callout: { tag: "div", slot: "callout-content" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  addon: true,
  secureLabel: true,
  planType: true,
  badge: { tag: "div", slot: "badge", default: "spectrum-yellow-300-plans" },
  allowedBadgeColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-gray-700-plans",
    "spectrum-green-900-plans"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-green-900-plans"
  ],
  borderColor: { attribute: "border-color" },
  size: ["wide", "super-wide"],
  whatsIncluded: { tag: "div", slot: "whats-included" },
  ctas: { slot: "footer", size: "m" },
  style: "consonant",
  perUnitLabel: { tag: "span", slot: "per-unit-label" }
};
var PLANS_EDUCATION_AEM_FRAGMENT_MAPPING = {
  ...function() {
    const { whatsIncluded, size, ...rest } = PLANS_AEM_FRAGMENT_MAPPING;
    return rest;
  }(),
  title: { tag: "h3", slot: "heading-s" },
  secureLabel: false
};
var PLANS_STUDENTS_AEM_FRAGMENT_MAPPING = {
  ...function() {
    const { subtitle, whatsIncluded, size, quantitySelect, ...rest } = PLANS_AEM_FRAGMENT_MAPPING;
    return rest;
  }()
};
var Plans = class extends VariantLayout {
  constructor(card) {
    super(card);
    this.adaptForMedia = this.adaptForMedia.bind(this);
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
    options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
  }
  getGlobalCSS() {
    return CSS5;
  }
  /**
   * Moves a slot to its proper place (body or footer) depending on card size and screen size
   * @param {string} name
   * @param {string[]} sizes
   * @param {boolean} shouldBeInFooter
   * @returns
   */
  adjustSlotPlacement(name, sizes, shouldBeInFooter) {
    const shadowRoot = this.card.shadowRoot;
    const footer = shadowRoot.querySelector("footer");
    const size = this.card.getAttribute("size");
    if (!size) return;
    const slotInFooter = shadowRoot.querySelector(
      `footer slot[name="${name}"]`
    );
    const slotInBody = shadowRoot.querySelector(
      `.body slot[name="${name}"]`
    );
    const body = shadowRoot.querySelector(".body");
    if (!size.includes("wide")) {
      footer?.classList.remove("wide-footer");
      if (slotInFooter) slotInFooter.remove();
    }
    if (!sizes.includes(size)) return;
    footer?.classList.toggle("wide-footer", isDesktop());
    if (!shouldBeInFooter && slotInFooter) {
      if (slotInBody) slotInFooter.remove();
      else {
        const bodyPlaceholder = body.querySelector(
          `[data-placeholder-for="${name}"]`
        );
        if (bodyPlaceholder) bodyPlaceholder.replaceWith(slotInFooter);
        else body.appendChild(slotInFooter);
      }
      return;
    }
    if (shouldBeInFooter && slotInBody) {
      const bodyPlaceholder = document.createElement("div");
      bodyPlaceholder.setAttribute("data-placeholder-for", name);
      bodyPlaceholder.classList.add("slot-placeholder");
      if (!slotInFooter) {
        const slotInBodyClone = slotInBody.cloneNode(true);
        footer.prepend(slotInBodyClone);
      }
      slotInBody.replaceWith(bodyPlaceholder);
    }
  }
  adaptForMedia() {
    if (!this.card.closest(
      "merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns"
    )) {
      this.card.removeAttribute("size");
      return;
    }
    this.adjustSlotPlacement("addon", ["super-wide"], isDesktop());
    this.adjustSlotPlacement(
      "callout-content",
      ["super-wide"],
      isDesktop()
    );
  }
  adjustCallout() {
    const tooltipIcon = this.card.querySelector(
      '[slot="callout-content"] .icon-button'
    );
    if (tooltipIcon && tooltipIcon.title) {
      tooltipIcon.dataset.tooltip = tooltipIcon.title;
      tooltipIcon.removeAttribute("title");
      tooltipIcon.classList.add("hide-tooltip");
      document.addEventListener("touchstart", (event) => {
        event.preventDefault();
        if (event.target !== tooltipIcon) {
          tooltipIcon.classList.add("hide-tooltip");
        } else {
          event.target.classList.toggle("hide-tooltip");
        }
      });
      document.addEventListener("mouseover", (event) => {
        event.preventDefault();
        if (event.target !== tooltipIcon) {
          tooltipIcon.classList.add("hide-tooltip");
        } else {
          event.target.classList.remove("hide-tooltip");
        }
      });
    }
  }
  async adjustEduLists() {
    if (this.card.variant !== "plans-education") return;
    const existingSpacer = this.card.querySelector(".spacer");
    if (existingSpacer) return;
    const body = this.card.querySelector('[slot="body-xs"]');
    if (!body) return;
    const list = body.querySelector("ul");
    if (!list) return;
    const listHeader = list.previousElementSibling;
    const spacer = document.createElement("div");
    spacer.classList.add("spacer");
    body.insertBefore(spacer, listHeader);
    const intersectionObs = new IntersectionObserver(([entry]) => {
      if (entry.boundingClientRect.height === 0) return;
      let offset = 0;
      const heading = this.card.querySelector('[slot="heading-s"]');
      if (heading) offset += getOuterHeight(heading);
      const subtitle = this.card.querySelector('[slot="subtitle"]');
      if (subtitle) offset += getOuterHeight(subtitle);
      const price2 = this.card.querySelector('[slot="heading-m"]');
      if (price2) offset += 8 + getOuterHeight(price2);
      for (const child of body.childNodes) {
        if (child.classList.contains("spacer")) break;
        offset += getOuterHeight(child);
      }
      const maxOffset = this.card.parentElement.style.getPropertyValue(
        "--merch-card-plans-edu-list-max-offset"
      );
      if (offset > (parseFloat(maxOffset) || 0)) {
        this.card.parentElement.style.setProperty(
          "--merch-card-plans-edu-list-max-offset",
          `${offset}px`
        );
      }
      this.card.style.setProperty(
        "--merch-card-plans-edu-list-offset",
        `${offset}px`
      );
      intersectionObs.disconnect();
    });
    intersectionObs.observe(this.card);
  }
  async postCardUpdateHook() {
    this.adaptForMedia();
    this.adjustTitleWidth();
    this.adjustAddon();
    this.adjustCallout();
    if (!this.legalAdjusted) {
      await this.adjustLegal();
      await this.adjustEduLists();
    }
  }
  get headingM() {
    return this.card.querySelector('[slot="heading-m"]');
  }
  get mainPrice() {
    const price2 = this.headingM.querySelector(
      `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price2;
  }
  get divider() {
    return this.card.variant === "plans-education" ? html6`<div class="divider"></div>` : nothing2;
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const prices = [];
      const headingPrice = this.card.querySelector(
        `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
      );
      if (headingPrice) prices.push(headingPrice);
      const legalPromises = prices.map(async (price2) => {
        const legal2 = price2.cloneNode(true);
        await price2.onceSettled();
        if (!price2?.options) return;
        if (price2.options.displayPerUnit)
          price2.dataset.displayPerUnit = "false";
        if (price2.options.displayTax)
          price2.dataset.displayTax = "false";
        if (price2.options.displayPlanType)
          price2.dataset.displayPlanType = "false";
        legal2.setAttribute("data-template", "legal");
        price2.parentNode.insertBefore(legal2, price2.nextSibling);
        await legal2.onceSettled();
      });
      await Promise.all(legalPromises);
    } catch {
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    addon.setAttribute("custom-checkbox", "");
    const price2 = this.mainPrice;
    if (!price2) return;
    await price2.onceSettled();
    const planType = price2.value?.[0]?.planType;
    if (!planType) return;
    addon.planType = planType;
  }
  get stockCheckbox() {
    return this.card.checkboxLabel ? html6`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>` : nothing2;
  }
  get icons() {
    if (!this.card.querySelector('[slot="icons"]') && !this.card.getAttribute("id"))
      return nothing2;
    return html6`<slot name="icons"></slot>`;
  }
  connectedCallbackHook() {
    const mobileWatcher = matchMobile();
    if (mobileWatcher?.addEventListener)
      mobileWatcher.addEventListener("change", this.adaptForMedia);
    const desktopWatcher = matchDesktop();
    if (desktopWatcher?.addEventListener)
      desktopWatcher.addEventListener("change", this.adaptForMedia);
  }
  disconnectedCallbackHook() {
    const mobileWatcher = matchMobile();
    if (mobileWatcher?.removeEventListener)
      mobileWatcher.removeEventListener("change", this.adaptForMedia);
    const desktopWatcher = matchDesktop();
    if (desktopWatcher?.removeEventListener)
      desktopWatcher.removeEventListener("change", this.adaptForMedia);
  }
  renderLayout() {
    return html6` ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="heading-xs"></slot>
                <slot name="heading-s"></slot>
                <slot name="subtitle"></slot>
                ${this.divider}
                <slot name="heading-m"></slot>
                <slot name="annualPrice"></slot>
                <slot name="priceLabel"></slot>
                <slot name="body-xxs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                ${this.stockCheckbox}
                <slot name="addon"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
  }
};
__publicField(Plans, "variantStyle", css3`
        :host([variant^='plans']) {
            min-height: 273px;
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
            --merch-card-plans-min-width: 244px;
            --merch-card-plans-padding: 15px;
            --merch-card-plans-subtitle-display: contents;
            --merch-card-plans-heading-min-height: 23px;
            --merch-color-green-promo: #05834e;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
            font-weight: 400;
        }

        :host([variant^='plans']) .slot-placeholder {
            display: none;
        }

        :host([variant='plans-education']) {
            min-height: unset;
        }

        :host([variant='plans-education']) ::slotted([slot='subtitle']) {
            font-size: var(--consonant-merch-card-heading-xxxs-font-size);
            line-height: var(--consonant-merch-card-heading-xxxs-line-height);
            font-style: italic;
            font-weight: 400;
        }

        :host([variant='plans-education']) .divider {
            border: 0;
            border-top: 1px solid #e8e8e8;
            margin-top: 8px;
            margin-bottom: 8px;
        }

        :host([variant='plans']) slot[name='subtitle'] {
            display: var(--merch-card-plans-subtitle-display);
            min-height: 18px;
            margin-top: 8px;
            margin-bottom: -8px;
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            min-height: var(--merch-card-plans-heading-min-height);
        }

        :host([variant^='plans']) .body {
            min-width: var(--merch-card-plans-min-width);
            padding: var(--merch-card-plans-padding);
        }

        :host([variant='plans'][size]) .body {
            max-width: none;
        }

        :host([variant^='plans']) ::slotted([slot='addon']) {
            margin-top: auto;
            padding-top: 8px;
        }

        :host([variant^='plans']) footer ::slotted([slot='addon']) {
            margin: 0;
            padding: 0;
        }

        :host([variant='plans']) .wide-footer #stock-checkbox {
            margin-top: 0;
        }

        :host([variant='plans']) #stock-checkbox {
            margin-top: 8px;
            gap: 9px;
            color: rgb(34, 34, 34);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
            padding-top: 4px;
            padding-bottom: 5px;
        }

        :host([variant='plans']) #stock-checkbox > span {
            border: 2px solid rgb(109, 109, 109);
            width: 12px;
            height: 12px;
        }

        :host([variant^='plans']) footer {
            padding: var(--merch-card-plans-padding);
            padding-top: 1px;
        }

        :host([variant='plans']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans']) #badge {
            border-radius: 4px 0 0 4px;
            font-weight: 400;
            line-height: 21px;
            padding: 2px 10px 3px;
        }
    `);
__publicField(Plans, "collectionOptions", {
  customHeaderArea: (collection) => {
    if (!collection.sidenav) return nothing2;
    return html6`<slot name="resultsText"></slot>`;
  },
  headerVisibility: {
    search: false,
    sort: false,
    result: ["mobile", "tablet"],
    custom: ["desktop"]
  }
});

// src/variants/product.js
import { html as html7, css as css4 } from "/deps/lit-all.min.js";

// src/variants/product.css.js
var CSS6 = `
:root {
  --consonant-merch-card-product-width: 300px;
}

  merch-card[variant="product"] merch-addon {
    padding-left: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 8px;
    border-radius: .5rem;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="product"] merch-addon [is="inline-price"] {
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="product"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="product"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

/* grid style for product */
.one-merch-card.product,
.two-merch-cards.product,
.three-merch-cards.product,
.four-merch-cards.product {
    grid-template-columns: var(--consonant-merch-card-product-width);
}

/* Tablet */
@media screen and ${TABLET_UP} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-product-width: 378px;
    --consonant-merch-card-product-width-4clm: 276px;
  }
    
  .three-merch-cards.product {
      grid-template-columns: repeat(3, var(--consonant-merch-card-product-width));
  }

  .four-merch-cards.product {
      grid-template-columns: repeat(4, var(--consonant-merch-card-product-width-4clm));
  }
}
`;

// src/variants/product.js
var Product = class extends VariantLayout {
  constructor(card) {
    super(card);
    this.postCardUpdateHook = this.postCardUpdateHook.bind(this);
  }
  getGlobalCSS() {
    return CSS6;
  }
  adjustProductBodySlots() {
    if (this.card.getBoundingClientRect().width === 0) return;
    const slots = [
      "heading-xs",
      "body-xxs",
      "body-xs",
      "promo-text",
      "callout-content",
      "addon",
      "body-lower"
    ];
    slots.forEach(
      (slot) => this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
        slot
      )
    );
  }
  renderLayout() {
    return html7` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html7`<slot name="promo-text"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html7`<slot name="promo-text"></slot>` : ""}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                <slot name="body-lower"></slot>
            </div>
            ${this.secureLabelFooter}`;
  }
  connectedCallbackHook() {
    window.addEventListener("resize", this.postCardUpdateHook);
  }
  disconnectedCallbackHook() {
    window.removeEventListener("resize", this.postCardUpdateHook);
  }
  postCardUpdateHook() {
    if (!this.card.isConnected) return;
    this.adjustAddon();
    if (!isMobile()) {
      this.adjustProductBodySlots();
    }
    this.adjustTitleWidth();
  }
  get headingXSSlot() {
    return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0];
  }
  get mainPrice() {
    const price2 = this.card.querySelector(
      `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price2;
  }
  toggleAddon(merchAddon) {
    const mainPrice = this.mainPrice;
    const headingXSSlot = this.headingXSSlot;
    if (!mainPrice && headingXSSlot) {
      const planType = merchAddon?.getAttribute("plan-type");
      let visibleSpan = null;
      if (merchAddon && planType) {
        const matchingP = merchAddon.querySelector(
          `p[data-plan-type="${planType}"]`
        );
        visibleSpan = matchingP?.querySelector(
          'span[is="inline-price"]'
        );
      }
      this.card.querySelectorAll('p[slot="heading-xs"]').forEach((p) => p.remove());
      if (merchAddon.checked) {
        if (visibleSpan) {
          const replacementP = createTag(
            "p",
            {
              class: "addon-heading-xs-price-addon",
              slot: "heading-xs"
            },
            visibleSpan.innerHTML
          );
          this.card.appendChild(replacementP);
        }
      } else {
        const freeP = createTag(
          "p",
          { class: "card-heading", id: "free", slot: "heading-xs" },
          "Free"
        );
        this.card.appendChild(freeP);
      }
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    const price2 = this.mainPrice;
    let planType = this.card.planType;
    if (price2) {
      await price2.onceSettled();
      planType = price2.value?.[0]?.planType;
    }
    if (!planType) return;
    addon.planType = planType;
  }
};
__publicField(Product, "variantStyle", css4`
        :host([variant='product']) > slot:not([name='icons']) {
            display: block;
        }
        :host([variant='product']) slot[name='body-xs'] {
            min-height: var(--consonant-merch-card-product-body-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='heading-xs'] {
            min-height: var(--consonant-merch-card-product-heading-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='body-xxs'] {
            min-height: var(--consonant-merch-card-product-body-xxs-height);
            display: block;
        }
        :host([variant='product']) slot[name='promo-text'] {
            min-height: var(--consonant-merch-card-product-promo-text-height);
            display: block;
        }
        :host([variant='product']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-product-callout-content-height
            );
            display: block;
        }
        :host([variant='product']) slot[name='addon'] {
            min-height: var(--consonant-merch-card-product-addon-height);
        }

        :host([variant='product']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }
    `);

// src/variants/segment.js
import { html as html8, css as css5 } from "/deps/lit-all.min.js";

// src/variants/segment.css.js
var CSS7 = `
:root {
  --consonant-merch-card-segment-width: 378px;
}

/* grid style for segment */
.one-merch-card.segment,
.two-merch-cards.segment,
.three-merch-cards.segment,
.four-merch-cards.segment {
  grid-template-columns: minmax(276px, var(--consonant-merch-card-segment-width));
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
    
  .two-merch-cards.segment,
  .three-merch-cards.segment,
  .four-merch-cards.segment {
      grid-template-columns: repeat(2, minmax(276px, var(--consonant-merch-card-segment-width)));
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-segment-width: 302px;
  }
    
  .three-merch-cards.segment {
      grid-template-columns: repeat(3, minmax(276px, var(--consonant-merch-card-segment-width)));
  }

  .four-merch-cards.segment {
      grid-template-columns: repeat(4, minmax(276px, var(--consonant-merch-card-segment-width)));
  }
}
`;

// src/variants/segment.js
var Segment = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS7;
  }
  postCardUpdateHook() {
    this.adjustTitleWidth();
  }
  renderLayout() {
    return html8` ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html8`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html8`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
            </div>
            <hr />
            ${this.secureLabelFooter}`;
  }
};
__publicField(Segment, "variantStyle", css5`
        :host([variant='segment']) {
            min-height: 214px;
        }
        :host([variant='segment']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }
    `);

// src/variants/special-offer.js
import { html as html9, css as css6 } from "/deps/lit-all.min.js";

// src/variants/special-offer.css.js
var CSS8 = `
:root {
  --consonant-merch-card-special-offers-width: 378px;
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="strikethrough"] {
  font-size: var(--consonant-merch-card-body-xs-font-size);
}

/* grid style for special-offers */
.one-merch-card.special-offers,
.two-merch-cards.special-offers,
.three-merch-cards.special-offers,
.four-merch-cards.special-offers {
  grid-template-columns: minmax(300px, var(--consonant-merch-card-special-offers-width));
}

@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
} 
  
@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
    
  .two-merch-cards.special-offers,
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-special-offers-width)));
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(3, minmax(300px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(4, minmax(300px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;

// src/variants/special-offer.js
var SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING = {
  name: { tag: "h4", slot: "detail-m" },
  title: { tag: "h4", slot: "detail-m" },
  backgroundImage: { tag: "div", slot: "bg-image" },
  prices: { tag: "h3", slot: "heading-xs" },
  description: { tag: "div", slot: "body-xs" },
  ctas: { slot: "footer", size: "l" }
};
var SpecialOffer = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS8;
  }
  get headingSelector() {
    return '[slot="detail-m"]';
  }
  renderLayout() {
    return html9`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xs"></slot>
            </div>
            ${this.evergreen ? html9`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card["detailBg"]}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  ` : html9`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`;
  }
};
__publicField(SpecialOffer, "variantStyle", css6`
        :host([variant='special-offers']) {
            min-height: 439px;
        }

        :host([variant='special-offers']) {
            width: var(--consonant-merch-card-special-offers-width);
        }

        :host([variant='special-offers'].center) {
            text-align: center;
        }
    `);

// src/variants/simplified-pricing-express.js
import { html as html10, css as css7 } from "/deps/lit-all.min.js";

// src/variants/simplified-pricing-express.css.js
var CSS9 = `
:root {
    --merch-card-simplified-pricing-express-width: 311px;
}

merch-card[variant="simplified-pricing-express"] merch-badge {
    white-space: nowrap;
    color: var(--spectrum-white);
    font-size: var(--consonant-merch-card-detail-m-font-size);
    line-height: var(--consonant-merch-card-detail-m-line-height);
}

/* Grid layout for simplified-pricing-express cards */
merch-card-collection.simplified-pricing-express {
    display: grid;
    justify-content: center;
    justify-items: center;
    align-items: stretch;
    gap: 16px;
    /* Default to 1 column on mobile */
    grid-template-columns: 1fr;
}

/* Also support direct merch-card children and wrapped in p tags */
merch-card-collection.simplified-pricing-express p {
    margin: 0;
    font-size: inherit;
}

/* Desktop - 3 columns */
@media screen and ${DESKTOP_UP} {
    merch-card-collection.simplified-pricing-express {
        grid-template-columns: repeat(3, 1fr);
        max-width: calc(3 * var(--merch-card-simplified-pricing-express-width) + 32px);
        margin: 0 auto;
    }
}

merch-card[variant="simplified-pricing-express"] p {
    margin: 0 !important; /* needed to override express-milo default margin to all <p> */
    font-size: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="heading-xs"] {
    font-size: 18px;
    font-weight: 700;
    line-height: 23.4px;
    color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] {
    font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
    line-height: var(--merch-card-simplified-pricing-express-body-xs-line-height, 18.2px);
    color: var(--spectrum-gray-700);
    margin-bottom: 32px;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] {
    display: block;
    width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.button {
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-weight: var(--merch-card-simplified-pricing-express-cta-font-weight);
    line-height: var(--merch-card-simplified-pricing-express-cta-line-height);
    font-size: var(--merch-card-simplified-pricing-express-cta-font-size);
    margin: 0;
    padding: 12px 24px 13px 24px;
    border-radius: 26px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--merch-card-simplified-pricing-express-padding);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"]:first-child {
  margin-inline-end: 8px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child {
  display: flex;
  align-items: baseline;
  margin: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"][data-template="optical"] {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p:empty {
  min-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-line-height);
  width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] .price-recurrence {
  font-size: var(--merch-card-simplified-pricing-express-price-recurrence-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-recurrence-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-recurrence-line-height);
}

/* Strikethrough price styling */
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-strikethrough,
merch-card[variant="simplified-pricing-express"] span.placeholder-resolved[data-template='strikethrough'] {
  text-decoration: none;
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price {
  color: var(--spectrum-gray-500);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p a {
  color: var(--spectrum-indigo-900);
  font-weight: 500;
  text-decoration: underline;
  white-space: nowrap;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals {
  font-size: 28px;
  font-weight: 700;
  line-height: 36.4px;
  text-decoration-thickness: 2px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals {
  text-decoration: line-through;
}

/* Apply indigo-800 color to optical price when preceded by strikethrough */
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] + span[is="inline-price"][data-template='optical'],
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] + span[is="inline-price"][data-template='optical'] .price-currency-symbol {
  color: var(--spectrum-indigo-900);
}

/* Ensure non-first paragraph prices have normal font weight */
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-recurrence {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

/* Hide screen reader only text */
merch-card[variant="simplified-pricing-express"] sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* mas-mnemonic inline styles for simplified-pricing-express */
merch-card[variant="simplified-pricing-express"] mas-mnemonic {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-inline-end: 8px;
    overflow: visible;
    padding-top: 16px;
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${MOBILE_LANDSCAPE} {
  merch-card-collection.simplified-pricing-express {
    gap: 8px;
  }
  
  merch-card[variant="simplified-pricing-express"] {
    width: 311px;
    max-width: 311px;
  }

  /* Badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="badge"] {
    font-size: 16px;
    font-weight: 400;
  }

  /* Trial badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] {
    margin-left: 0;
    align-self: flex-start;
  }
  
  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] merch-badge {
    font-size: 12px;
    line-height: 20.8px;
  }

  /* Fix spacing between cards on mobile */
  main merch-card-collection.simplified-pricing-express p:has(merch-card[variant="simplified-pricing-express"]),
  main .section p:has(merch-card[variant="simplified-pricing-express"]) {
    margin: 0;
  }
}

/* Collapse/expand styles for all tablet and mobile viewports */
@media screen and ${TABLET_DOWN} {
  /* Collapsed state - hide content sections */
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="price"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="cta"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="cta"] {
    display: none;
    visibility: hidden;
    height: 0;
    margin: 0;
    padding: 0;
  }

  /* Expanded state - explicitly show content */
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="cta"] {
    display: block;
    visibility: visible;
    height: auto;
  }

  /* Collapsed card should have fixed height and padding */
  merch-card[variant="simplified-pricing-express"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) {
    max-height: 57px;
    padding: 0;
    overflow: hidden;
    border-radius: 8px;
  }

  merch-card[variant="simplified-pricing-express"][gradient-border="true"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"][gradient-border="true"]:not([data-expanded="true"]) {
    max-height: 85px;
  }
}

/* Tablet styles - extending mobile styles with specific adjustments */
@media screen and ${TABLET_UP} and ${TABLET_DOWN} {
  merch-card-collection.simplified-pricing-express {
    padding: var(--spacing-m) 32px;
    grid-template-columns: 1fr;
    gap: 24px;
    width: var(--merch-card-simplified-pricing-express-tablet-width);
    margin: 0 auto;
  }
  
  merch-card[variant="simplified-pricing-express"] {
      min-width: var(--merch-card-simplified-pricing-express-tablet-width);
  }
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"],
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent {
    background-color: var(--spectrum-indigo-900);
    color: var(--spectrum-white, #ffffff);
    width: 100%;
}

/* Ensure text color is applied to the label span element for accessibility */
merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"] .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent .spectrum-Button-label {
    color: var(--spectrum-white, #ffffff);
}
`;

// src/variants/simplified-pricing-express.js
var isTabletOrBelow = () => window.matchMedia(TABLET_DOWN).matches;
var SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
  title: {
    tag: "h3",
    slot: "heading-xs",
    maxCount: 250,
    withSuffix: true
  },
  badge: {
    tag: "div",
    slot: "badge",
    default: "spectrum-blue-400"
  },
  allowedBadgeColors: [
    "spectrum-blue-400",
    "spectrum-gray-300",
    "spectrum-yellow-300",
    "gradient-purple-blue",
    "gradient-firefly-spectrum"
  ],
  description: {
    tag: "div",
    slot: "body-xs",
    maxCount: 2e3,
    withSuffix: false
  },
  prices: {
    tag: "div",
    slot: "price"
  },
  ctas: {
    slot: "cta",
    size: "XL"
  },
  borderColor: {
    attribute: "border-color",
    specialValues: {
      gray: "var(--spectrum-gray-300)",
      blue: "var(--spectrum-blue-400)",
      "gradient-purple-blue": "linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)",
      "gradient-firefly-spectrum": "linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"
    }
  },
  disabledAttributes: [
    "badgeColor",
    "badgeBorderColor",
    "trialBadgeColor",
    "trialBadgeBorderColor"
  ],
  supportsDefaultChild: true
};
var SimplifiedPricingExpress = class extends VariantLayout {
  getGlobalCSS() {
    return CSS9;
  }
  get aemFragmentMapping() {
    return SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
  }
  get headingSelector() {
    return '[slot="heading-xs"]';
  }
  connectedCallbackHook() {
    if (!this.card || this.card.failed) {
      return;
    }
    this.setupAccordion();
    requestAnimationFrame(() => {
      if (this.card?.hasAttribute("data-default-card") && isTabletOrBelow()) {
        this.card.setAttribute("data-expanded", "true");
      }
    });
  }
  setupAccordion() {
    const merchCard = this.card;
    if (!merchCard) {
      return;
    }
    const updateExpandedState = () => {
      if (isTabletOrBelow()) {
        const isDefaultCard = merchCard.hasAttribute("data-default-card");
        merchCard.setAttribute(
          "data-expanded",
          isDefaultCard ? "true" : "false"
        );
      } else {
        merchCard.removeAttribute("data-expanded");
      }
    };
    updateExpandedState();
    const mediaQuery = window.matchMedia(TABLET_DOWN);
    this.mediaQueryListener = () => {
      updateExpandedState();
    };
    mediaQuery.addEventListener("change", this.mediaQueryListener);
    this.attributeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-default-card" && this.card.hasAttribute("data-default-card") && isTabletOrBelow()) {
          this.card.setAttribute("data-expanded", "true");
        }
      });
    });
    this.attributeObserver.observe(this.card, {
      attributes: true,
      attributeOldValue: true
    });
  }
  disconnectedCallbackHook() {
    if (this.mediaQueryListener) {
      const mediaQuery = window.matchMedia(TABLET_DOWN);
      mediaQuery.removeEventListener("change", this.mediaQueryListener);
    }
    if (this.attributeObserver) {
      this.attributeObserver.disconnect();
    }
  }
  handleChevronClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const merchCard = this.card;
    if (!merchCard || !isTabletOrBelow()) {
      return;
    }
    const currentExpanded = merchCard.getAttribute("data-expanded");
    const isExpanded = currentExpanded === "true";
    const newExpanded = !isExpanded ? "true" : "false";
    merchCard.setAttribute("data-expanded", newExpanded);
  }
  renderLayout() {
    return html10`
            <div class="badge-wrapper">
                <slot name="badge"></slot>
            </div>
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <slot name="trial-badge"></slot>
                    <button
                        class="chevron-button"
                        @click=${(e) => this.handleChevronClick(e)}
                    >
                        <svg
                            class="chevron-icon"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 15.5L5 8.5L6.4 7.1L12 12.7L17.6 7.1L19 8.5L12 15.5Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="description">
                    <slot name="body-xs"></slot>
                </div>
                <div class="price">
                    <slot name="price"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot></slot>
        `;
  }
};
__publicField(SimplifiedPricingExpress, "variantStyle", css7`
        :host([variant='simplified-pricing-express']) {
            /* CSS Variables */
            --merch-card-simplified-pricing-express-width: 365px;
            --merch-card-simplified-pricing-express-tablet-width: 532px;
            --merch-card-simplified-pricing-express-padding: 24px;
            --merch-card-simplified-pricing-express-padding-mobile: 16px;
            --merch-card-simplified-pricing-express-min-height: 341px;
            --merch-card-simplified-pricing-express-price-font-size: 28px;
            --merch-card-simplified-pricing-express-price-p-font-size: 12px;
            --merch-card-simplified-pricing-express-price-p-line-height: 15.6px;
            --merch-card-simplified-pricing-express-price-font-weight: 700;
            --merch-card-simplified-pricing-express-price-line-height: 36.4px;
            --merch-card-simplified-pricing-express-price-currency-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-symbol-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-recurrence-font-size: 12px;
            --merch-card-simplified-pricing-express-price-recurrence-font-weight: 700;
            --merch-card-simplified-pricing-express-price-recurrence-line-height: 15.6px;
            --merch-card-simplified-pricing-express-body-xs-font-size: 14px;
            --merch-card-simplified-pricing-express-body-xs-line-height: 18.2px;
            --merch-card-simplified-pricing-express-price-p-font-size: 12px;
            --merch-card-simplified-pricing-express-price-p-font-weight: 400;
            --merch-card-simplified-pricing-express-price-p-line-height: 15.6px;
            --merch-card-simplified-pricing-express-cta-font-size: 18px;
            --merch-card-simplified-pricing-express-cta-font-weight: 700;
            --merch-card-simplified-pricing-express-cta-line-height: 23.4px;

            /* Gradient definitions */
            --gradient-purple-blue: linear-gradient(
                96deg,
                #b539c8 0%,
                #7155fa 66%,
                #3b63fb 100%
            );
            --gradient-firefly-spectrum: linear-gradient(
                96deg,
                #d73220 0%,
                #d92361 33%,
                #7155fa 100%
            );
            width: var(--merch-card-simplified-pricing-express-width);
            max-width: var(--merch-card-simplified-pricing-express-width);
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
            position: relative;
        }

        /* Badge wrapper styling */
        :host([variant='simplified-pricing-express']) .badge-wrapper {
            padding: 4px 12px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 12px;
            font-weight: 500;
            line-height: 15.6px;
            color: var(--spectrum-gray-800);
            position: relative;
            min-height: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Hide badge wrapper when empty */
        :host([variant='simplified-pricing-express']) .badge-wrapper:empty {
            display: none;
        }

        /* Also hide when badge slot is empty */
        :host(
                [variant='simplified-pricing-express']:not(
                        :has([slot='badge']:not(:empty))
                    )
            )
            .badge-wrapper {
            display: none;
        }

        /* Card content styling */
        :host([variant='simplified-pricing-express']) .card-content {
            border-radius: 8px;
            padding: var(--merch-card-simplified-pricing-express-padding);
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--consonant-merch-spacing-xxs);
            position: relative;
        }

        /* Ensure content appears above pseudo-element background */
        :host([variant='simplified-pricing-express']) .card-content > * {
            position: relative;
        }

        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    )
            )
            .card-content {
            background: var(--spectrum-gray-50);
            border: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        /* Collapsed state for non-gradient cards */
        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    )[data-expanded='false']
            )
            .card-content {
            overflow: hidden;
        }

        /* When badge exists, adjust card content border radius */
        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        /* When badge exists with regular border, ensure top border */
        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    ):has([slot='badge']:not(:empty))
            )
            .card-content {
            border-top: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        /* When badge has content, ensure seamless connection */
        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .badge-wrapper {
            margin-bottom: -2px;
        }

        /* Common gradient border styles */
        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper {
            border: none;
            margin-bottom: -6px;
            padding-bottom: 6px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper
            ::slotted(*) {
            color: white !important;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content {
            position: relative;
            border: none;
            padding: calc(
                var(--merch-card-simplified-pricing-express-padding) + 2px
            );
            border-radius: 8px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            background: var(--spectrum-gray-50);
            border-radius: 7px;
            z-index: 0;
            pointer-events: none;
        }

        /* Gradient-specific backgrounds */
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background: var(--gradient-purple-blue);
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background: var(--gradient-firefly-spectrum);
        }

        /* When gradient and badge exist, keep rounded corners for smooth transition */
        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }

        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content::before {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }

        :host([variant='simplified-pricing-express']) .header {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
        }

        /* Font specifications for heading and body */
        :host([variant='simplified-pricing-express']) [slot='heading-xs'] {
            font-size: 18px;
            font-weight: 700;
            line-height: 23.4px;
            color: var(--spectrum-gray-800);
        }

        :host([variant='simplified-pricing-express']) .description {
            gap: 16px;
            display: flex;
            flex-direction: column;
        }

        :host([variant='simplified-pricing-express']) .price {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            margin-top: auto;
        }

        /* Desktop only - Fixed heights for alignment */
        @media (min-width: 1200px) {
            :host([variant='simplified-pricing-express']) {
                display: flex;
                flex-direction: column;
                height: auto;
            }

            :host([variant='simplified-pricing-express']) .cta {
                flex-shrink: 0;
            }
        }

        :host([variant='simplified-pricing-express']) .cta,
        :host([variant='simplified-pricing-express']) .cta ::slotted(*) {
            width: 100%;
            display: block;
        }

        /* Mobile accordion styles */
        :host([variant='simplified-pricing-express']) .chevron-button {
            display: none;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        :host([variant='simplified-pricing-express']) .chevron-icon {
            width: 24px;
            height: 24px;
            color: var(--spectrum-gray-800);
            transition: transform 0.3s ease;
        }

        /* Chevron rotation based on parent card's data-expanded attribute */
        :host-context(merch-card[data-expanded='false']) .chevron-icon {
            transform: rotate(0deg);
        }
        :host-context(merch-card[data-expanded='true']) .chevron-icon {
            transform: rotate(180deg);
        }

        /* Mobile and Tablet styles */
        @media (max-width: 1199px) {
            :host([variant='simplified-pricing-express']) {
                width: 311px;
                max-width: 311px;
                min-height: auto;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            :host([variant='simplified-pricing-express']) .header {
                position: relative;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }

            :host([variant='simplified-pricing-express']) .chevron-button {
                display: block;
                flex-shrink: 0;
                margin-left: auto;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content,
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                padding: calc(
                    var(
                            --merch-card-simplified-pricing-express-padding-mobile
                        ) +
                        2px
                );
            }

            /* Hide badge-wrapper on mobile/tablet except for gradient borders */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .badge-wrapper {
                display: none;
            }

            /* Gradient border collapsed state - limit badge-wrapper height */
            :host(
                    [variant='simplified-pricing-express'][gradient-border='true'][data-expanded='false']
                )
                .card-content {
                overflow: hidden;
                padding: 16px 16px 35px 16px;
            }
        }
    `);

// src/variants/mini.js
import { css as css8, html as html11 } from "/deps/lit-all.min.js";

// src/variants/mini.css.js
var CSS10 = `
merch-card[variant="mini"] {
  color: var(--spectrum-body-color);
  width: 400px;
  height: 250px;
}

merch-card[variant="mini"] .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant="mini"] [slot="title"] {
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
}

merch-card[variant="mini"] [slot="legal"] {
    min-height: 17px;
}

merch-card[variant="mini"] [slot="ctas"] {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: end;
  justify-content: end;
}

merch-card[variant="mini"] span.promo-duration-text,
merch-card[variant="mini"] span.renewal-text {
    display: block;
}
`;

// src/variants/mini.js
var MINI_AEM_FRAGMENT_MAPPING = {
  title: { tag: "p", slot: "title" },
  prices: { tag: "p", slot: "prices" },
  description: {
    tag: "p",
    slot: "description"
  },
  planType: true,
  ctas: { slot: "ctas", size: "S" }
};
var Mini = class extends VariantLayout {
  constructor() {
    super(...arguments);
    __publicField(this, "legal");
  }
  async postCardUpdateHook() {
    await this.card.updateComplete;
    this.adjustLegal();
  }
  getGlobalCSS() {
    return CSS10;
  }
  get headingSelector() {
    return '[slot="title"]';
  }
  priceOptionsProvider(element, options) {
    options.literals = {
      ...options.literals,
      strikethroughAriaLabel: "",
      alternativePriceAriaLabel: ""
    };
    options.space = true;
    options.displayAnnual = this.card.settings?.displayAnnual ?? false;
  }
  adjustLegal() {
    if (this.legal !== void 0) return;
    const price2 = this.card.querySelector(
      `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    if (!price2) return;
    const legal2 = price2.cloneNode(true);
    this.legal = legal2;
    price2.dataset.displayTax = "false";
    legal2.dataset.template = "legal";
    legal2.dataset.displayPlanType = this.card?.settings?.displayPlanType ?? true;
    legal2.setAttribute("slot", "legal");
    this.card.appendChild(legal2);
  }
  renderLayout() {
    return html11`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `;
  }
};
__publicField(Mini, "variantStyle", css8`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);

// src/variants/variants.js
var variantRegistry = /* @__PURE__ */ new Map();
var registerVariant = (name, variantClass, fragmentMapping = null, style = null, collectionOptions) => {
  variantRegistry.set(name, {
    class: variantClass,
    fragmentMapping,
    style,
    collectionOptions
  });
};
registerVariant(
  "catalog",
  Catalog,
  CATALOG_AEM_FRAGMENT_MAPPING,
  Catalog.variantStyle
);
registerVariant("image", Image);
registerVariant("inline-heading", InlineHeading);
registerVariant(
  "mini-compare-chart",
  MiniCompareChart,
  null,
  MiniCompareChart.variantStyle
);
registerVariant(
  "plans",
  Plans,
  PLANS_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant(
  "plans-students",
  Plans,
  PLANS_STUDENTS_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant(
  "plans-education",
  Plans,
  PLANS_EDUCATION_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant("product", Product, null, Product.variantStyle);
registerVariant("segment", Segment, null, Segment.variantStyle);
registerVariant(
  "special-offers",
  SpecialOffer,
  SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING,
  SpecialOffer.variantStyle
);
registerVariant(
  "simplified-pricing-express",
  SimplifiedPricingExpress,
  SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
  SimplifiedPricingExpress.variantStyle
);
registerVariant("mini", Mini, MINI_AEM_FRAGMENT_MAPPING, Mini.variantStyle);
function getFragmentMapping(variant) {
  return variantRegistry.get(variant)?.fragmentMapping;
}

// ../node_modules/@dexter/tacocat-core/src/utilities.js
var namespace = "tacocat.js";
var equalsCaseInsensitive = (value1, value2) => String(value1 ?? "").toLowerCase() == String(value2 ?? "").toLowerCase();
var escapeHtml = (html13) => `${html13 ?? ""}`.replace(
  /[&<>'"]/g,
  (tag) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[tag] ?? tag
) ?? "";
function getParameter(key, defaults = {}, { metadata = true, search = true, storage = true } = {}) {
  let param;
  if (search && param == null) {
    const params = new URLSearchParams(window.location.search);
    const searchKey = isString(search) ? search : key;
    param = params.get(searchKey);
  }
  if (storage && param == null) {
    const storageKey = isString(storage) ? storage : key;
    param = window.sessionStorage.getItem(storageKey) ?? window.localStorage.getItem(storageKey);
  }
  if (metadata && param == null) {
    const metadataKey = toKebabCase(isString(metadata) ? metadata : key);
    const element = document.documentElement.querySelector(
      `meta[name="${metadataKey}"]`
    );
    param = element?.content;
  }
  return param == null ? defaults[key] : param;
}
var isBoolean = (value) => typeof value === "boolean";
var isFunction = (value) => typeof value === "function";
var isNumber = (value) => typeof value === "number";
var isObject = (value) => value != null && typeof value === "object";
var isString = (value) => typeof value === "string";
var isNotEmptyString = (value) => isString(value) && value;
var isPositiveFiniteNumber = (value) => isNumber(value) && Number.isFinite(value) && value > 0;
function omitProperties(target, test = (value) => value == null || value === "") {
  if (target != null) {
    Object.entries(target).forEach(([key, value]) => {
      if (test(value)) delete target[key];
    });
  }
  return target;
}
function toBoolean(value, defaultValue) {
  if (isBoolean(value)) return value;
  const string = String(value);
  if (string === "1" || string === "true") return true;
  if (string === "0" || string === "false") return false;
  return defaultValue;
}
function toEnumeration(value, enumeration, defaultValue) {
  const values = Object.values(enumeration);
  return values.find((candidate) => equalsCaseInsensitive(candidate, value)) ?? defaultValue ?? values[0];
}
function toKebabCase(value = "") {
  return String(value).replace(
    /(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,
    (_, p1, p2) => `${p1}-${p2}`
  ).replace(/\W+/gu, "-").toLowerCase();
}
function toPositiveFiniteInteger(value, defaultValue = 1) {
  if (!isNumber(value)) {
    value = Number.parseInt(value, 10);
  }
  if (!Number.isNaN(value) && value > 0 && Number.isFinite(value)) {
    return value;
  }
  return defaultValue;
}

// ../node_modules/@dexter/tacocat-core/src/log.js
var epoch = Date.now();
var suffix = () => `(+${Date.now() - epoch}ms)`;
var loggers = /* @__PURE__ */ new Set();
var isDebugEnabled = toBoolean(
  getParameter("tacocat.debug", {}, { metadata: false }),
  false
);
function createLog(source) {
  const prefix = `[${namespace}/${source}]`;
  const assert = (condition, message, ...args) => {
    if (!condition) {
      error(message, ...args);
      return false;
    }
    return true;
  };
  const debug = isDebugEnabled ? (message, ...args) => {
    console.debug(`${prefix} ${message}`, ...args, suffix());
  } : () => {
  };
  const error = (message, ...args) => {
    const prefixedMessage = `${prefix} ${message}`;
    loggers.forEach(
      ([errorLogger]) => errorLogger(prefixedMessage, ...args)
    );
  };
  const warn = (message, ...args) => {
    const prefixedMessage = `${prefix} ${message}`;
    loggers.forEach(
      ([, warnLogger]) => warnLogger(prefixedMessage, ...args)
    );
  };
  return { assert, debug, error, warn };
}
function registerLogger(errorLogger, warnLogger) {
  const logger = [errorLogger, warnLogger];
  loggers.add(logger);
  return () => {
    loggers.delete(logger);
  };
}
registerLogger(
  (message, ...args) => {
    console.error(message, ...args, suffix());
  },
  (message, ...args) => {
    console.warn(message, ...args, suffix());
  }
);

// ../node_modules/@dexter/tacocat-core/src/promotion.js
var NO_PROMO_TEXT = "no promo";
var CLASS = "promo-tag";
var PROMO_VARIANT = "yellow";
var NOPROMO_VARIANT = "neutral";
var fullPromoText = (promo, old, isOverriden) => {
  const promoText = (promo2) => promo2 || NO_PROMO_TEXT;
  const suffix2 = isOverriden ? ` (was "${promoText(old)}")` : "";
  return `${promoText(promo)}${suffix2}`;
};
var PROMO_CONTEXT_CANCEL_VALUE = "cancel-context";
var computePromoStatus = (overriden, configured) => {
  const localPromoUnset = overriden === PROMO_CONTEXT_CANCEL_VALUE;
  const localPromoSet = !localPromoUnset && overriden?.length > 0;
  const isOverriden = (localPromoSet || localPromoUnset) && //in case configured equals override, we consider no override
  (configured && configured != overriden || //in case it does not have been configured, if overriden to cancel,
  // we consider no override
  !configured && !localPromoUnset);
  const isPromo = isOverriden && localPromoSet || !isOverriden && !!configured;
  const effectivePromoCode = isPromo ? overriden || configured : void 0;
  return {
    effectivePromoCode,
    overridenPromoCode: overriden,
    className: isPromo ? CLASS : `${CLASS} no-promo`,
    text: fullPromoText(effectivePromoCode, configured, isOverriden),
    variant: isPromo ? PROMO_VARIANT : NOPROMO_VARIANT,
    isOverriden
  };
};

// ../node_modules/@pandora/data-models-odm/esm/businessDimensions.js
var OfferType;
(function(OfferType2) {
  OfferType2["BASE"] = "BASE";
  OfferType2["TRIAL"] = "TRIAL";
  OfferType2["PROMOTION"] = "PROMOTION";
})(OfferType || (OfferType = {}));
var Commitment2;
(function(Commitment3) {
  Commitment3["MONTH"] = "MONTH";
  Commitment3["YEAR"] = "YEAR";
  Commitment3["TWO_YEARS"] = "TWO_YEARS";
  Commitment3["THREE_YEARS"] = "THREE_YEARS";
  Commitment3["PERPETUAL"] = "PERPETUAL";
  Commitment3["TERM_LICENSE"] = "TERM_LICENSE";
  Commitment3["ACCESS_PASS"] = "ACCESS_PASS";
  Commitment3["THREE_MONTHS"] = "THREE_MONTHS";
  Commitment3["SIX_MONTHS"] = "SIX_MONTHS";
})(Commitment2 || (Commitment2 = {}));
var Term2;
(function(Term3) {
  Term3["ANNUAL"] = "ANNUAL";
  Term3["MONTHLY"] = "MONTHLY";
  Term3["TWO_YEARS"] = "TWO_YEARS";
  Term3["THREE_YEARS"] = "THREE_YEARS";
  Term3["P1D"] = "P1D";
  Term3["P1Y"] = "P1Y";
  Term3["P3Y"] = "P3Y";
  Term3["P10Y"] = "P10Y";
  Term3["P15Y"] = "P15Y";
  Term3["P3D"] = "P3D";
  Term3["P7D"] = "P7D";
  Term3["P30D"] = "P30D";
  Term3["HALF_YEARLY"] = "HALF_YEARLY";
  Term3["QUARTERLY"] = "QUARTERLY";
})(Term2 || (Term2 = {}));
var CustomerSegment;
(function(CustomerSegment2) {
  CustomerSegment2["INDIVIDUAL"] = "INDIVIDUAL";
  CustomerSegment2["TEAM"] = "TEAM";
  CustomerSegment2["ENTERPRISE"] = "ENTERPRISE";
})(CustomerSegment || (CustomerSegment = {}));
var MarketSegment;
(function(MarketSegment2) {
  MarketSegment2["COM"] = "COM";
  MarketSegment2["EDU"] = "EDU";
  MarketSegment2["GOV"] = "GOV";
})(MarketSegment || (MarketSegment = {}));
var SalesChannel;
(function(SalesChannel2) {
  SalesChannel2["DIRECT"] = "DIRECT";
  SalesChannel2["INDIRECT"] = "INDIRECT";
})(SalesChannel || (SalesChannel = {}));
var BuyingProgram;
(function(BuyingProgram2) {
  BuyingProgram2["ENTERPRISE_PRODUCT"] = "ENTERPRISE_PRODUCT";
  BuyingProgram2["ETLA"] = "ETLA";
  BuyingProgram2["RETAIL"] = "RETAIL";
  BuyingProgram2["VIP"] = "VIP";
  BuyingProgram2["VIPMP"] = "VIPMP";
  BuyingProgram2["FREE"] = "FREE";
})(BuyingProgram || (BuyingProgram = {}));

// ../node_modules/@dexter/tacocat-core/src/wcsUtils.js
var ABM = "ABM";
var PUF = "PUF";
var M2M = "M2M";
var PERPETUAL = "PERPETUAL";
var P3Y = "P3Y";
var TAX_INCLUSIVE_DETAILS = "TAX_INCLUSIVE_DETAILS";
var TAX_EXCLUSIVE = "TAX_EXCLUSIVE";
var PlanType = {
  ABM,
  PUF,
  M2M,
  PERPETUAL,
  P3Y
};
var planTypes = {
  [ABM]: { commitment: Commitment2.YEAR, term: Term2.MONTHLY },
  [PUF]: { commitment: Commitment2.YEAR, term: Term2.ANNUAL },
  [M2M]: { commitment: Commitment2.MONTH, term: Term2.MONTHLY },
  [PERPETUAL]: { commitment: Commitment2.PERPETUAL, term: void 0 },
  [P3Y]: { commitment: Commitment2.THREE_MONTHS, term: Term2.P3Y }
};
var errorValueNotOffer = "Value is not an offer";
var applyPlanType = (offer) => {
  if (typeof offer !== "object") return errorValueNotOffer;
  const { commitment, term } = offer;
  const planType = getPlanType(commitment, term);
  return { ...offer, planType };
};
var getPlanType = (commitment, term) => {
  switch (commitment) {
    case void 0:
      return errorValueNotOffer;
    case "":
      return "";
    case Commitment2.YEAR:
      return term === Term2.MONTHLY ? ABM : term === Term2.ANNUAL ? PUF : "";
    case Commitment2.MONTH:
      return term === Term2.MONTHLY ? M2M : "";
    case Commitment2.PERPETUAL:
      return PERPETUAL;
    case Commitment2.TERM_LICENSE:
      return term === Term2.P3Y ? P3Y : "";
    default:
      return "";
  }
};
function forceTaxExclusivePrice(offer) {
  const { priceDetails } = offer;
  const {
    price: price2,
    priceWithoutDiscount,
    priceWithoutTax,
    priceWithoutDiscountAndTax,
    taxDisplay
  } = priceDetails;
  if (taxDisplay !== TAX_INCLUSIVE_DETAILS) return offer;
  const amendedOffer = {
    ...offer,
    priceDetails: {
      ...priceDetails,
      price: priceWithoutTax ?? price2,
      priceWithoutDiscount: priceWithoutDiscountAndTax ?? priceWithoutDiscount,
      taxDisplay: TAX_EXCLUSIVE
    }
  };
  if (amendedOffer.offerType === "TRIAL" && amendedOffer.priceDetails.price === 0) {
    amendedOffer.priceDetails.price = amendedOffer.priceDetails.priceWithoutDiscount;
  }
  return amendedOffer;
}

// src/utilities.js
var MAS_COMMERCE_SERVICE2 = "mas-commerce-service";
var FETCH_INFO_HEADERS = {
  requestId: HEADER_X_REQUEST_ID,
  etag: "Etag",
  lastModified: "Last-Modified",
  serverTiming: "server-timing"
};
function selectOffers(offers, { country, forceTaxExclusive }) {
  let selected;
  if (offers.length < 2) selected = offers;
  else {
    const language = country === "GB" ? "EN" : "MULT";
    offers.sort(
      (a, b) => a.language === language ? -1 : b.language === language ? 1 : 0
    );
    offers.sort((a, b) => {
      if (!a.term && b.term) return -1;
      if (a.term && !b.term) return 1;
      return 0;
    });
    selected = [offers[0]];
  }
  if (forceTaxExclusive) {
    selected = selected.map(forceTaxExclusivePrice);
  }
  return selected;
}
var setImmediate = (getConfig) => window.setTimeout(getConfig);
function toQuantity(value, defaultValue = 1) {
  if (value == null) return [defaultValue];
  let quantity = (Array.isArray(value) ? value : String(value).split(",")).map(toPositiveFiniteInteger).filter(isPositiveFiniteNumber);
  if (!quantity.length) quantity = [defaultValue];
  return quantity;
}
function toOfferSelectorIds(value) {
  if (value == null) return [];
  const ids = Array.isArray(value) ? value : String(value).split(",");
  return ids.filter(isNotEmptyString);
}
function getService2() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE2)?.[0];
}
function getLogHeaders(response) {
  const logHeaders = {};
  if (!response?.headers) return logHeaders;
  const headers = response.headers;
  for (const [key, value] of Object.entries(FETCH_INFO_HEADERS)) {
    let headerValue = headers.get(value);
    if (headerValue) {
      headerValue = headerValue.replace(/[,;]/g, "|");
      headerValue = headerValue.replace(/[| ]+/g, "|");
      logHeaders[key] = headerValue;
    }
  }
  return logHeaders;
}

// src/lana.js
var config = {
  clientId: "merch-at-scale",
  delimiter: "\xB6",
  ignoredProperties: ["analytics", "literals", "element"],
  serializableTypes: ["Array", "Object"],
  sampleRate: 1,
  tags: "acom",
  isProdDomain: false
};
var PAGE_LIMIT = 1e3;
function isError(value) {
  return value instanceof Error || typeof value?.originatingRequest === "string";
}
function serializeValue(value) {
  if (value == null) return void 0;
  const type = typeof value;
  if (type === "function") {
    return value.name ? `function ${value.name}` : "function";
  }
  if (type === "object") {
    if (value instanceof Error) return value.message;
    if (typeof value.originatingRequest === "string") {
      const { message, originatingRequest, status } = value;
      return [message, status, originatingRequest].filter(Boolean).join(" ");
    }
    const objectType = value[Symbol.toStringTag] ?? Object.getPrototypeOf(value).constructor.name;
    if (!config.serializableTypes.includes(objectType)) return objectType;
  }
  return value;
}
function serializeParam(key, value) {
  if (config.ignoredProperties.includes(key)) return void 0;
  return serializeValue(value);
}
var lanaAppender = {
  append(entry) {
    if (entry.level !== "error") return;
    const { message, params } = entry;
    const errors = [];
    const values = [];
    let payload = message;
    params.forEach((param) => {
      if (param != null) {
        (isError(param) ? errors : values).push(param);
      }
    });
    if (errors.length) {
      payload += " " + errors.map(serializeValue).join(" ");
    }
    const { pathname, search } = window.location;
    let page = `${config.delimiter}page=${pathname}${search}`;
    if (page.length > PAGE_LIMIT) {
      page = `${page.slice(0, PAGE_LIMIT)}<trunc>`;
    }
    payload += page;
    if (values.length) {
      payload += `${config.delimiter}facts=`;
      payload += JSON.stringify(values, serializeParam);
    }
    window.lana?.log(payload, config);
  }
};
function updateConfig(newConfig) {
  Object.assign(
    config,
    Object.fromEntries(
      Object.entries(newConfig).filter(
        ([key, value]) => key in config && value !== "" && value !== null && value !== void 0 && !Number.isNaN(value)
        // Correctly exclude NaN
      )
    )
  );
}

// src/log.js
var HostEnv = {
  LOCAL: "local",
  PROD: "prod",
  STAGE: "stage"
};
var LogLevels = {
  DEBUG: "debug",
  ERROR: "error",
  INFO: "info",
  WARN: "warn"
};
var appenders = /* @__PURE__ */ new Set();
var filters = /* @__PURE__ */ new Set();
var loggerIndexes = /* @__PURE__ */ new Map();
var consoleAppender = {
  append({ level, message, params, timestamp, source }) {
    console[level](
      `${timestamp}ms [${source}] %c${message}`,
      "font-weight: bold;",
      ...params
    );
  }
};
var debugFilter = { filter: ({ level }) => level !== LogLevels.DEBUG };
var quietFilter = { filter: () => false };
function createEntry(level, message, namespace2, params, source) {
  return {
    level,
    message,
    namespace: namespace2,
    get params() {
      if (params.length === 1 && isFunction(params[0])) {
        params = params[0]();
        if (!Array.isArray(params)) params = [params];
      }
      return params;
    },
    source,
    timestamp: performance.now().toFixed(3)
  };
}
function handleEntry(entry) {
  if ([...filters].every((filter) => filter(entry))) {
    appenders.forEach((appender) => appender(entry));
  }
}
function createLog2(namespace2) {
  const index = (loggerIndexes.get(namespace2) ?? 0) + 1;
  loggerIndexes.set(namespace2, index);
  const id = `${namespace2} #${index}`;
  const log2 = {
    id,
    namespace: namespace2,
    module: (name) => createLog2(`${log2.namespace}/${name}`),
    updateConfig
  };
  Object.values(LogLevels).forEach((level) => {
    log2[level] = (message, ...params) => handleEntry(createEntry(level, message, namespace2, params, id));
  });
  return Object.seal(log2);
}
function use(...plugins) {
  plugins.forEach((plugin) => {
    const { append, filter } = plugin;
    if (isFunction(filter)) filters.add(filter);
    if (isFunction(append)) appenders.add(append);
  });
}
function init(env = {}) {
  const { name } = env;
  const debug = toBoolean(
    getParameter("commerce.debug", { search: true, storage: true }),
    name === HostEnv.LOCAL
  );
  if (debug) use(consoleAppender);
  else use(debugFilter);
  if (name === HostEnv.PROD) use(lanaAppender);
  return Log;
}
function reset() {
  appenders.clear();
  filters.clear();
}
var Log = {
  ...createLog2(LOG_NAMESPACE),
  Level: LogLevels,
  Plugins: { consoleAppender, debugFilter, quietFilter, lanaAppender },
  init,
  reset,
  use
};

// src/mas-error.js
var MasError = class _MasError extends Error {
  /**
   * Creates a new MasError instance
   * @param {string} message - The error message
   * @param {Object} context - Additional context information about the error
   * @param {unknown} cause - The original error that caused this error
   */
  constructor(message, context, cause) {
    super(message, { cause });
    this.name = "MasError";
    if (context.response) {
      const requestId = context.response.headers?.get(HEADER_X_REQUEST_ID);
      if (requestId) {
        context.requestId = requestId;
      }
      if (context.response.status) {
        context.status = context.response.status;
        context.statusText = context.response.statusText;
      }
      if (context.response.url) {
        context.url = context.response.url;
      }
    }
    delete context.response;
    this.context = context;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _MasError);
    }
  }
  /**
   * Returns a string representation of the error including context
   * @returns {string} String representation of the error
   */
  toString() {
    const contextStr = Object.entries(this.context || {}).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ");
    let errorString = `${this.name}: ${this.message}`;
    if (contextStr) {
      errorString += ` (${contextStr})`;
    }
    if (this.cause) {
      errorString += `
Caused by: ${this.cause}`;
    }
    return errorString;
  }
};

// src/mas-element.js
var StateClassName = {
  [STATE_FAILED]: CLASS_NAME_FAILED,
  [STATE_PENDING]: CLASS_NAME_PENDING,
  [STATE_RESOLVED]: CLASS_NAME_RESOLVED
};
var StateEventType = {
  [STATE_FAILED]: EVENT_TYPE_FAILED,
  [STATE_RESOLVED]: EVENT_TYPE_RESOLVED
};
var _service;
var MasElement = class {
  constructor(wrapperElement) {
    __privateAdd(this, _service);
    __publicField(this, "changes", /* @__PURE__ */ new Map());
    __publicField(this, "connected", false);
    __publicField(this, "error");
    __publicField(this, "log");
    __publicField(this, "options");
    __publicField(this, "promises", []);
    __publicField(this, "state", STATE_PENDING);
    __publicField(this, "timer", null);
    __publicField(this, "value");
    __publicField(this, "version", 0);
    __publicField(this, "wrapperElement");
    this.wrapperElement = wrapperElement;
    this.log = Log.module("mas-element");
  }
  update() {
    [STATE_FAILED, STATE_PENDING, STATE_RESOLVED].forEach((state) => {
      this.wrapperElement.classList.toggle(
        StateClassName[state],
        state === this.state
      );
    });
  }
  notify() {
    if (this.state === STATE_RESOLVED || this.state === STATE_FAILED) {
      if (this.state === STATE_RESOLVED) {
        this.promises.forEach(
          ({ resolve }) => resolve(this.wrapperElement)
        );
      } else if (this.state === STATE_FAILED) {
        this.promises.forEach(({ reject }) => reject(this.error));
      }
      this.promises = [];
    }
    let detail = this.error;
    if (this.error instanceof MasError) {
      detail = {
        message: this.error.message,
        ...this.error.context
      };
    }
    this.wrapperElement.dispatchEvent(
      new CustomEvent(StateEventType[this.state], {
        bubbles: true,
        detail
      })
    );
  }
  /**
   * Adds name/value of the updated attribute to the `changes` map,
   * requests placeholder update.
   */
  attributeChangedCallback(name, _, value) {
    this.changes.set(name, value);
    this.requestUpdate();
  }
  /**
   * Triggers when this component is connected to DOM.
   * Subscribes to the `ready` event of the commerce service,
   * requests placeholder update.
   */
  connectedCallback() {
    __privateSet(this, _service, getService2());
    this.requestUpdate(true);
  }
  /**
   * Triggers when this component is disconnected from DOM.
   * Runs and then erases all disposers.
   */
  disconnectedCallback() {
    if (this.connected) {
      this.connected = false;
      this.log?.debug("Disconnected:", { element: this.wrapperElement });
    }
  }
  /**
   * Returns a promise resolving to this placeholder
   * when its value is resolved or rejected.
   * If placeholder is not pending for completion of an async operation
   * the returned promise is already resolved or rejected.
   */
  onceSettled() {
    const { error, promises, state } = this;
    if (STATE_RESOLVED === state)
      return Promise.resolve(this.wrapperElement);
    if (STATE_FAILED === state) return Promise.reject(error);
    return new Promise((resolve, reject) => {
      promises.push({ resolve, reject });
    });
  }
  /**
   * Sets component state to "RESOLVED".
   * Updates its class list and stored value, notifies observers and fires "RESOLVED" event.
   */
  toggleResolved(version, value, options) {
    if (version !== this.version) return false;
    if (options !== void 0) this.options = options;
    this.state = STATE_RESOLVED;
    this.value = value;
    this.update();
    this.log?.debug("Resolved:", { element: this.wrapperElement, value });
    setImmediate(() => this.notify());
    return true;
  }
  /**
   * Sets component state to "FAILED".
   * Updates its class list and stored error, notifies observers and fires "FAILED" event.
   */
  toggleFailed(version, error, options) {
    if (version !== this.version) return false;
    if (options !== void 0) this.options = options;
    this.error = error;
    this.state = STATE_FAILED;
    this.update();
    const wcName = this.wrapperElement.getAttribute("is");
    this.log?.error(`${wcName}: Failed to render: ${error.message}`, {
      element: this.wrapperElement,
      ...error.context,
      ...__privateGet(this, _service)?.duration
    });
    setImmediate(() => this.notify());
    return true;
  }
  /**
   * Sets component state to "PENDING".
   * Increments its version, updates CSS classes, notifies observers and fires "PENDING" event.
   */
  togglePending(options) {
    this.version++;
    if (options) this.options = options;
    this.state = STATE_PENDING;
    this.update();
    this.log?.debug("Pending:", {
      osi: this.wrapperElement?.options?.wcsOsi
    });
    return this.version;
  }
  /**
   * Queues task to update this component.
   * Skips rendering if update is not forced and no changes were accumulated since the previous update.
   * Calls `render` method to perform the update.
   * Restores previous state of the component if the `render` method returned `false`.
   */
  requestUpdate(force = false) {
    if (!this.wrapperElement.isConnected || !getService2()) return;
    if (this.timer) return;
    const { error, options, state, value, version } = this;
    this.state = STATE_PENDING;
    this.timer = setImmediate(async () => {
      this.timer = null;
      let changes = null;
      if (this.changes.size) {
        changes = Object.fromEntries(this.changes.entries());
        this.changes.clear();
      }
      if (this.connected) {
        this.log?.debug("Updated:", {
          element: this.wrapperElement,
          changes
        });
      } else {
        this.connected = true;
        this.log?.debug("Connected:", {
          element: this.wrapperElement,
          changes
        });
      }
      if (changes || force) {
        try {
          const result = await this.wrapperElement.render?.();
          if (result === false && this.state === STATE_PENDING && this.version === version) {
            this.state = state;
            this.error = error;
            this.value = value;
            this.update();
            this.notify();
          }
        } catch (error2) {
          this.toggleFailed(this.version, error2, options);
        }
      }
    });
  }
};
_service = new WeakMap();
function cleanupDataset(dataset = {}) {
  Object.entries(dataset).forEach(([key, value]) => {
    const remove = value == null || value === "" || value?.length === 0;
    if (remove) delete dataset[key];
  });
  return dataset;
}
function createMasElement(Class, dataset = {}) {
  const { tag, is } = Class;
  const element = document.createElement(tag, { is });
  element.setAttribute("is", is);
  Object.assign(element.dataset, cleanupDataset(dataset));
  return element;
}
function updateMasElement(element, dataset = {}) {
  if (element instanceof HTMLElement) {
    Object.assign(element.dataset, cleanupDataset(dataset));
    return element;
  }
  return null;
}

// src/upt-link.js
function getPromoTermsUrl(env) {
  const host = env === "PRODUCTION" ? "www.adobe.com" : "www.stage.adobe.com";
  return `https://${host}/offers/promo-terms.html`;
}
var _service2;
var _UptLink = class _UptLink extends HTMLAnchorElement {
  constructor() {
    super();
    __publicField(this, "masElement", new MasElement(this));
    __privateAdd(this, _service2);
    this.setAttribute("is", _UptLink.is);
  }
  get isUptLink() {
    return true;
  }
  /**
   * @param {string} osi
   * @param {string} promotionCode
   */
  initializeWcsData(osi, promotionCode) {
    this.setAttribute("data-wcs-osi", osi);
    if (promotionCode)
      this.setAttribute("data-promotion-code", promotionCode);
  }
  attributeChangedCallback(name, oldValue, value) {
    this.masElement.attributeChangedCallback(name, oldValue, value);
  }
  connectedCallback() {
    this.masElement.connectedCallback();
    __privateSet(this, _service2, getService());
    if (__privateGet(this, _service2)) {
      this.log = __privateGet(this, _service2).log.module("upt-link");
    }
  }
  disconnectedCallback() {
    this.masElement.disconnectedCallback();
    __privateSet(this, _service2, void 0);
  }
  requestUpdate(force = false) {
    this.masElement.requestUpdate(force);
  }
  onceSettled() {
    return this.masElement.onceSettled();
  }
  async render() {
    const service = getService();
    if (!service) return false;
    if (!this.dataset.imsCountry) {
      service.imsCountryPromise.then((countryCode) => {
        if (countryCode) this.dataset.imsCountry = countryCode;
      });
    }
    const options = service.collectCheckoutOptions({}, this);
    if (!options.wcsOsi) {
      this.log.error(`Missing 'data-wcs-osi' attribute on upt-link.`);
      return false;
    }
    const version = this.masElement.togglePending(options);
    const promises = service.resolveOfferSelectors(options);
    try {
      const [[offer]] = await Promise.all(promises);
      const { country, language, env } = options;
      let params = `locale=${language}_${country}&country=${country}&offer_id=${offer.offerId}`;
      const promotionCode = this.getAttribute("data-promotion-code");
      if (promotionCode)
        params += `&promotion_code=${encodeURIComponent(promotionCode)}`;
      this.href = `${getPromoTermsUrl(env)}?${params}`;
      this.masElement.toggleResolved(version, offer, options);
    } catch (error) {
      const masError = new Error(
        `Could not resolve offer selectors for id: ${options.wcsOsi}.`,
        error.message
      );
      this.masElement.toggleFailed(version, masError, options);
      return false;
    }
  }
  /**
   * @param {HTMLElement} element
   */
  static createFrom(element) {
    const uptLink = new _UptLink();
    for (const attribute of element.attributes) {
      if (attribute.name === "is") continue;
      if (attribute.name === "class" && attribute.value.includes("upt-link"))
        uptLink.setAttribute(
          "class",
          attribute.value.replace("upt-link", "").trim()
        );
      else uptLink.setAttribute(attribute.name, attribute.value);
    }
    uptLink.innerHTML = element.innerHTML;
    uptLink.setAttribute("tabindex", 0);
    return uptLink;
  }
};
_service2 = new WeakMap();
__publicField(_UptLink, "is", "upt-link");
__publicField(_UptLink, "tag", "a");
__publicField(_UptLink, "observedAttributes", [
  "data-wcs-osi",
  "data-promotion-code",
  "data-ims-country"
]);
var UptLink = _UptLink;
if (!window.customElements.get(UptLink.is)) {
  window.customElements.define(UptLink.is, UptLink, {
    extends: UptLink.tag
  });
}

// src/hydrate.js
function normalizeVariant(variant) {
  if (!variant) return variant;
  if (variant.startsWith("plans")) return "plans";
  return variant;
}

// src/checkout-mixin.js
var CLASS_NAME_DOWNLOAD = "download";
var CLASS_NAME_UPGRADE = "upgrade";
var CHECKOUT_PARAM_VALUE_MAPPING = {
  e: "EDU",
  t: "TEAM"
};
function createCheckoutElement(Class, options = {}, innerHTML = "") {
  const service = getService2();
  if (!service) return null;
  const {
    checkoutMarketSegment,
    checkoutWorkflow,
    checkoutWorkflowStep,
    entitlement,
    upgrade,
    modal,
    perpetual,
    promotionCode,
    quantity,
    wcsOsi,
    extraOptions,
    analyticsId
  } = service.collectCheckoutOptions(options);
  const element = createMasElement(Class, {
    checkoutMarketSegment,
    checkoutWorkflow,
    checkoutWorkflowStep,
    entitlement,
    upgrade,
    modal,
    perpetual,
    promotionCode,
    quantity,
    wcsOsi,
    extraOptions,
    analyticsId
  });
  if (innerHTML)
    element.innerHTML = `<span style="pointer-events: none;">${innerHTML}</span>`;
  return element;
}
function CheckoutMixin(Base) {
  return class CheckoutBase extends Base {
    constructor() {
      super(...arguments);
      /* c8 ignore next 1 */
      __publicField(this, "checkoutActionHandler");
      __publicField(this, "masElement", new MasElement(this));
    }
    attributeChangedCallback(name, oldValue, value) {
      this.masElement.attributeChangedCallback(name, oldValue, value);
    }
    connectedCallback() {
      this.masElement.connectedCallback();
      this.addEventListener("click", this.clickHandler);
    }
    disconnectedCallback() {
      this.masElement.disconnectedCallback();
      this.removeEventListener("click", this.clickHandler);
    }
    onceSettled() {
      return this.masElement.onceSettled();
    }
    get value() {
      return this.masElement.value;
    }
    get options() {
      return this.masElement.options;
    }
    get marketSegment() {
      const value = this.options?.ms ?? this.value?.[0].marketSegments?.[0];
      return CHECKOUT_PARAM_VALUE_MAPPING[value] ?? value;
    }
    get customerSegment() {
      const value = this.options?.cs ?? this.value?.[0]?.customerSegment;
      return CHECKOUT_PARAM_VALUE_MAPPING[value] ?? value;
    }
    get is3in1Modal() {
      return Object.values(MODAL_TYPE_3_IN_1).includes(
        this.getAttribute("data-modal")
      );
    }
    get isOpen3in1Modal() {
      const masFF3in1 = document.querySelector("meta[name=mas-ff-3in1]");
      return this.is3in1Modal && (!masFF3in1 || masFF3in1.content !== "off");
    }
    requestUpdate(force = false) {
      return this.masElement.requestUpdate(force);
    }
    static get observedAttributes() {
      return [
        "data-checkout-workflow",
        "data-checkout-workflow-step",
        "data-extra-options",
        "data-ims-country",
        "data-perpetual",
        "data-promotion-code",
        "data-quantity",
        "data-template",
        "data-wcs-osi",
        "data-entitlement",
        "data-upgrade",
        "data-modal"
      ];
    }
    async render(overrides = {}) {
      const service = getService2();
      if (!service) return false;
      if (!this.dataset.imsCountry) {
        service.imsCountryPromise.then((countryCode) => {
          if (countryCode) this.dataset.imsCountry = countryCode;
        });
      }
      overrides.imsCountry = null;
      const options = service.collectCheckoutOptions(overrides, this);
      if (!options.wcsOsi.length) return false;
      let extraOptions;
      try {
        extraOptions = JSON.parse(options.extraOptions ?? "{}");
      } catch (e) {
        this.masElement.log?.error(
          "cannot parse exta checkout options",
          e
        );
      }
      const version = this.masElement.togglePending(options);
      this.setCheckoutUrl("");
      const promises = service.resolveOfferSelectors(options);
      let offers = await Promise.all(promises);
      offers = offers.map((offer) => selectOffers(offer, options));
      options.country = this.dataset.imsCountry || options.country;
      const checkoutAction = await service.buildCheckoutAction?.(
        offers.flat(),
        { ...extraOptions, ...options },
        this
      );
      return this.renderOffers(
        offers.flat(),
        options,
        {},
        checkoutAction,
        version
      );
    }
    /**
     * Renders checkout link href for provided offers into this component.
     * @param {Commerce.Wcs.Offer[]} offers
     * @param {Commerce.Checkout.Options} options
     * @param {Commerce.Checkout.AnyOptions} overrides
     * @param {Commerce.Checkout.CheckoutAction} checkoutAction
     * @param {number} version
     */
    renderOffers(offers, options, overrides = {}, checkoutAction = void 0, version = void 0) {
      const service = getService2();
      if (!service) return false;
      const extraOptions = JSON.parse(this.dataset.extraOptions ?? "{}");
      options = { ...extraOptions, ...options, ...overrides };
      version ?? (version = this.masElement.togglePending(options));
      if (this.checkoutActionHandler) {
        this.checkoutActionHandler = void 0;
      }
      if (checkoutAction) {
        this.classList.remove(CLASS_NAME_DOWNLOAD, CLASS_NAME_UPGRADE);
        this.masElement.toggleResolved(version, offers, options);
        const { url, text, className, handler } = checkoutAction;
        if (url) {
          this.setCheckoutUrl(url);
        }
        if (text) this.firstElementChild.innerHTML = text;
        if (className) this.classList.add(...className.split(" "));
        if (handler) {
          this.setCheckoutUrl("#");
          this.checkoutActionHandler = handler.bind(this);
        }
      }
      if (offers.length) {
        if (this.masElement.toggleResolved(version, offers, options)) {
          if (!this.classList.contains(CLASS_NAME_DOWNLOAD) && !this.classList.contains(CLASS_NAME_UPGRADE)) {
            const url = service.buildCheckoutURL(offers, options);
            this.setCheckoutUrl(
              options.modal === "true" ? "#" : url
            );
          }
          return true;
        }
      } else {
        const error = new Error(
          `Not provided: ${options?.wcsOsi ?? "-"}`
        );
        if (this.masElement.toggleFailed(version, error, options)) {
          this.setCheckoutUrl("#");
          return true;
        }
      }
    }
    setCheckoutUrl() {
    }
    clickHandler(e) {
    }
    updateOptions(options = {}) {
      const service = getService2();
      if (!service) return false;
      const {
        checkoutMarketSegment,
        checkoutWorkflow,
        checkoutWorkflowStep,
        entitlement,
        upgrade,
        modal,
        perpetual,
        promotionCode,
        quantity,
        wcsOsi
      } = service.collectCheckoutOptions(options);
      updateMasElement(this, {
        checkoutMarketSegment,
        checkoutWorkflow,
        checkoutWorkflowStep,
        entitlement,
        upgrade,
        modal,
        perpetual,
        promotionCode,
        quantity,
        wcsOsi
      });
      return true;
    }
  };
}

// src/checkout-link.js
var _CheckoutLink = class _CheckoutLink extends CheckoutMixin(HTMLAnchorElement) {
  static createCheckoutLink(options = {}, innerHTML = "") {
    return createCheckoutElement(_CheckoutLink, options, innerHTML);
  }
  setCheckoutUrl(value) {
    this.setAttribute("href", value);
  }
  get isCheckoutLink() {
    return true;
  }
  clickHandler(e) {
    if (this.checkoutActionHandler) {
      this.checkoutActionHandler?.(e);
      return;
    }
  }
};
__publicField(_CheckoutLink, "is", "checkout-link");
__publicField(_CheckoutLink, "tag", "a");
var CheckoutLink = _CheckoutLink;
if (!window.customElements.get(CheckoutLink.is)) {
  window.customElements.define(CheckoutLink.is, CheckoutLink, {
    extends: CheckoutLink.tag
  });
}

// src/buildCheckoutUrl.js
var AF_DRAFT_LANDSCAPE = "p_draft_landscape";
var UCV3_PREFIX = "/store/";
var PARAMETERS = /* @__PURE__ */ new Map([
  ["countrySpecific", "cs"],
  ["customerSegment", "cs"],
  ["quantity", "q"],
  ["authCode", "code"],
  ["checkoutPromoCode", "apc"],
  ["rurl", "rUrl"],
  ["curl", "cUrl"],
  ["ctxrturl", "ctxRtUrl"],
  ["country", "co"],
  ["language", "lang"],
  ["clientId", "cli"],
  ["context", "ctx"],
  ["productArrangementCode", "pa"],
  ["addonProductArrangementCode", "ao"],
  ["offerType", "ot"],
  ["marketSegment", "ms"]
]);
var ALLOWED_KEYS = /* @__PURE__ */ new Set([
  "af",
  "ai",
  "ao",
  "apc",
  "appctxid",
  "cli",
  "co",
  "cs",
  "csm",
  "ctx",
  "ctxRtUrl",
  "DCWATC",
  "dp",
  // Enable digital payments for iframe context
  "fr",
  // represents the commerce app redirecting to UC
  "gsp",
  "ijt",
  "lang",
  "lo",
  "mal",
  "ms",
  "mv",
  "mv2",
  "nglwfdata",
  "ot",
  "otac",
  "pa",
  "pcid",
  // Unified Paywall configuration ID for analytics
  "promoid",
  "q",
  "rf",
  "sc",
  "scl",
  "sdid",
  "sid",
  // x-adobe-clientsession
  "spint",
  "svar",
  "th",
  "thm",
  "trackingid",
  "usid",
  "workflowid",
  "context.guid",
  "so.ca",
  "so.su",
  "so.tr",
  "so.va"
]);
var REQUIRED_KEYS = ["env", "workflowStep", "clientId", "country"];
var mapParameterName = (field) => PARAMETERS.get(field) ?? field;
function addParameters(inputParameters, resultParameters, allowedKeys) {
  for (const [key, value] of Object.entries(inputParameters)) {
    const mappedKey = mapParameterName(key);
    if (value != null && allowedKeys.has(mappedKey)) {
      resultParameters.set(mappedKey, value);
    }
  }
}
function getHostName(env) {
  switch (env) {
    case PROVIDER_ENVIRONMENT.PRODUCTION:
      return "https://commerce.adobe.com";
    default:
      return "https://commerce-stg.adobe.com";
  }
}
function setItemsParameter(items, parameters) {
  for (const idx in items) {
    const item = items[idx];
    for (const [key, value] of Object.entries(item)) {
      if (value == null) continue;
      const parameterName = mapParameterName(key);
      parameters.set(`items[${idx}][${parameterName}]`, value);
    }
  }
}
function add3in1Parameters({ url, modal, is3in1 }) {
  if (!is3in1 || !url?.searchParams) return url;
  url.searchParams.set("rtc", "t");
  url.searchParams.set("lo", "sl");
  const existingAf = url.searchParams.get("af");
  url.searchParams.set(
    "af",
    [existingAf, "uc_new_user_iframe", "uc_new_system_close"].filter(Boolean).join(",")
  );
  if (url.searchParams.get("cli") !== "doc_cloud") {
    url.searchParams.set(
      "cli",
      modal === MODAL_TYPE_3_IN_1.CRM ? "creative" : "mini_plans"
    );
  }
  return url;
}
function buildCheckoutUrl(checkoutData) {
  validateCheckoutData(checkoutData);
  const {
    env,
    items,
    workflowStep,
    marketSegment,
    customerSegment,
    offerType,
    productArrangementCode,
    landscape,
    modal,
    is3in1,
    preselectPlan,
    ...rest
  } = checkoutData;
  let url = new URL(getHostName(env));
  url.pathname = `${UCV3_PREFIX}${workflowStep}`;
  if (workflowStep !== CheckoutWorkflowStep.SEGMENTATION && workflowStep !== CheckoutWorkflowStep.CHANGE_PLAN_TEAM_PLANS) {
    setItemsParameter(items, url.searchParams);
  }
  addParameters({ ...rest }, url.searchParams, ALLOWED_KEYS);
  if (landscape === Landscape.DRAFT) {
    addParameters(
      { af: AF_DRAFT_LANDSCAPE },
      url.searchParams,
      ALLOWED_KEYS
    );
  }
  if (workflowStep === CheckoutWorkflowStep.SEGMENTATION) {
    const segmentationParameters = {
      marketSegment,
      offerType,
      customerSegment,
      productArrangementCode,
      quantity: items?.[0]?.quantity,
      addonProductArrangementCode: productArrangementCode ? items?.find(
        (item) => item.productArrangementCode !== productArrangementCode
      )?.productArrangementCode : items?.[1]?.productArrangementCode
    };
    if (preselectPlan?.toLowerCase() === "edu") {
      url.searchParams.set("ms", "EDU");
    } else if (preselectPlan?.toLowerCase() === "team") {
      url.searchParams.set("cs", "TEAM");
    }
    addParameters(segmentationParameters, url.searchParams, ALLOWED_KEYS);
    if (url.searchParams.get("ot") === "PROMOTION")
      url.searchParams.delete("ot");
    url = add3in1Parameters({
      url,
      modal,
      is3in1
    });
  }
  return url.toString();
}
function validateCheckoutData(checkoutData) {
  for (const key of REQUIRED_KEYS) {
    if (!checkoutData[key]) {
      throw new Error(
        'Argument "checkoutData" is not valid, missing: ' + key
      );
    }
  }
  if (checkoutData.workflowStep !== CheckoutWorkflowStep.SEGMENTATION && checkoutData.workflowStep !== CheckoutWorkflowStep.CHANGE_PLAN_TEAM_PLANS && !checkoutData.items) {
    throw new Error('Argument "checkoutData" is not valid, missing: items');
  }
  return true;
}

// src/defaults.js
var Defaults = Object.freeze({
  checkoutClientId: "adobe_com",
  checkoutWorkflowStep: CheckoutWorkflowStep.EMAIL,
  country: "US",
  displayOldPrice: false,
  displayPerUnit: false,
  displayRecurrence: true,
  displayTax: false,
  displayPlanType: false,
  env: Env.PRODUCTION,
  forceTaxExclusive: false,
  language: "en",
  entitlement: false,
  extraOptions: {},
  modal: false,
  promotionCode: "",
  quantity: 1,
  alternativePrice: false,
  wcsApiKey: "wcms-commerce-ims-ro-user-milo",
  wcsURL: "https://www.adobe.com/web_commerce_artifact",
  landscape: Landscape.PUBLISHED
});

// src/checkout.js
function Checkout({ settings, providers }) {
  function collectCheckoutOptions(overrides, placeholder) {
    const {
      checkoutClientId,
      checkoutWorkflowStep: defaultWorkflowStep,
      country: defaultCountry,
      language: defaultLanguage,
      promotionCode: defaultPromotionCode,
      quantity: defaultQuantity,
      preselectPlan,
      env
    } = settings;
    let options = {
      checkoutClientId,
      checkoutWorkflowStep: defaultWorkflowStep,
      country: defaultCountry,
      language: defaultLanguage,
      promotionCode: defaultPromotionCode,
      quantity: defaultQuantity,
      preselectPlan,
      env
    };
    if (placeholder) {
      for (const provider of providers.checkout) {
        provider(placeholder, options);
      }
    }
    const {
      checkoutMarketSegment,
      checkoutWorkflowStep = defaultWorkflowStep,
      imsCountry: imsCountry2,
      country = imsCountry2 ?? defaultCountry,
      language = defaultLanguage,
      quantity = defaultQuantity,
      entitlement,
      upgrade,
      modal,
      perpetual,
      promotionCode = defaultPromotionCode,
      wcsOsi,
      extraOptions,
      ...rest
    } = Object.assign(options, placeholder?.dataset ?? {}, overrides ?? {});
    const workflowStep = toEnumeration(
      checkoutWorkflowStep,
      CheckoutWorkflowStep,
      Defaults.checkoutWorkflowStep
    );
    options = omitProperties({
      ...rest,
      extraOptions,
      checkoutClientId,
      checkoutMarketSegment,
      country,
      quantity: toQuantity(quantity, Defaults.quantity),
      checkoutWorkflowStep: workflowStep,
      language,
      entitlement: toBoolean(entitlement),
      upgrade: toBoolean(upgrade),
      modal,
      perpetual: toBoolean(perpetual),
      promotionCode: computePromoStatus(promotionCode).effectivePromoCode,
      wcsOsi: toOfferSelectorIds(wcsOsi),
      preselectPlan
    });
    return options;
  }
  function buildCheckoutURL(offers, options) {
    if (!Array.isArray(offers) || !offers.length || !options) {
      return "";
    }
    const { env, landscape } = settings;
    const {
      checkoutClientId: clientId,
      checkoutMarketSegment,
      checkoutWorkflowStep: workflowStep,
      country,
      promotionCode: checkoutPromoCode,
      quantity: optionsQuantity,
      preselectPlan,
      ms,
      cs,
      ...rest
    } = collectCheckoutOptions(options);
    const masFF3in1 = document.querySelector("meta[name=mas-ff-3in1]");
    const is3in1 = Object.values(MODAL_TYPE_3_IN_1).includes(options.modal) && (!masFF3in1 || masFF3in1.content !== "off");
    const context = window.frameElement || is3in1 ? "if" : "fp";
    const [
      {
        productArrangementCode,
        marketSegments: [offerMarketSegment],
        customerSegment: offerCustomerSegment,
        offerType
      }
    ] = offers;
    let marketSegment = ms ?? offerMarketSegment ?? checkoutMarketSegment;
    let customerSegment = cs ?? offerCustomerSegment;
    if (preselectPlan?.toLowerCase() === "edu") {
      marketSegment = "EDU";
    } else if (preselectPlan?.toLowerCase() === "team") {
      customerSegment = "TEAM";
    }
    const data = {
      is3in1,
      checkoutPromoCode,
      clientId,
      context,
      country,
      env,
      items: [],
      marketSegment,
      customerSegment,
      offerType,
      productArrangementCode,
      workflowStep,
      landscape,
      ...rest
    };
    const quantity = optionsQuantity[0] > 1 ? optionsQuantity[0] : void 0;
    if (offers.length === 1) {
      const { offerId } = offers[0];
      data.items.push({ id: offerId, quantity });
    } else {
      data.items.push(
        ...offers.map(({ offerId, productArrangementCode: productArrangementCode2 }) => ({
          id: offerId,
          quantity,
          ...is3in1 ? { productArrangementCode: productArrangementCode2 } : {}
        }))
      );
    }
    return buildCheckoutUrl(data);
  }
  const { createCheckoutLink } = CheckoutLink;
  return {
    CheckoutLink,
    CheckoutWorkflowStep,
    buildCheckoutURL,
    collectCheckoutOptions,
    createCheckoutLink
  };
}

// src/ims.js
function imsReady({ interval = 200, maxAttempts = 25 } = {}) {
  const log2 = Log.module("ims");
  return new Promise((resolve) => {
    log2.debug("Waing for IMS to be ready");
    let count = 0;
    function poll() {
      if (window.adobeIMS?.initialized) {
        resolve();
      } else if (++count > maxAttempts) {
        log2.debug("Timeout");
        resolve();
      } else {
        setTimeout(poll, interval);
      }
    }
    poll();
  });
}
function imsSignedIn(imsReadyPromise) {
  return imsReadyPromise.then(
    () => window.adobeIMS?.isSignedInUser() ?? false
  );
}
function imsCountry(imsSignedInPromise) {
  const log2 = Log.module("ims");
  return imsSignedInPromise.then((signedIn) => {
    if (!signedIn) return null;
    return window.adobeIMS.getProfile().then(
      ({ countryCode }) => {
        log2.debug("Got user country:", countryCode);
        return countryCode;
      },
      (error) => {
        log2.error("Unable to get user country:", error);
        return void 0;
      }
    );
  });
}
function Ims({}) {
  const imsReadyPromise = imsReady();
  const imsSignedInPromise = imsSignedIn(imsReadyPromise);
  const imsCountryPromise = imsCountry(imsSignedInPromise);
  return { imsReadyPromise, imsSignedInPromise, imsCountryPromise };
}

// src/literals.js
var priceLiterals = window.masPriceLiterals;
function getPriceLiterals(settings) {
  if (Array.isArray(priceLiterals)) {
    const find = (language) => priceLiterals.find(
      (candidate) => equalsCaseInsensitive(candidate.lang, language)
    );
    const literals = find(settings.language) ?? find(Defaults.language);
    if (literals) return Object.freeze(literals);
  }
  return {};
}

// ../node_modules/tslib/tslib.es6.mjs
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

// ../node_modules/@formatjs/icu-messageformat-parser/lib/error.js
var ErrorKind;
(function(ErrorKind2) {
  ErrorKind2[ErrorKind2["EXPECT_ARGUMENT_CLOSING_BRACE"] = 1] = "EXPECT_ARGUMENT_CLOSING_BRACE";
  ErrorKind2[ErrorKind2["EMPTY_ARGUMENT"] = 2] = "EMPTY_ARGUMENT";
  ErrorKind2[ErrorKind2["MALFORMED_ARGUMENT"] = 3] = "MALFORMED_ARGUMENT";
  ErrorKind2[ErrorKind2["EXPECT_ARGUMENT_TYPE"] = 4] = "EXPECT_ARGUMENT_TYPE";
  ErrorKind2[ErrorKind2["INVALID_ARGUMENT_TYPE"] = 5] = "INVALID_ARGUMENT_TYPE";
  ErrorKind2[ErrorKind2["EXPECT_ARGUMENT_STYLE"] = 6] = "EXPECT_ARGUMENT_STYLE";
  ErrorKind2[ErrorKind2["INVALID_NUMBER_SKELETON"] = 7] = "INVALID_NUMBER_SKELETON";
  ErrorKind2[ErrorKind2["INVALID_DATE_TIME_SKELETON"] = 8] = "INVALID_DATE_TIME_SKELETON";
  ErrorKind2[ErrorKind2["EXPECT_NUMBER_SKELETON"] = 9] = "EXPECT_NUMBER_SKELETON";
  ErrorKind2[ErrorKind2["EXPECT_DATE_TIME_SKELETON"] = 10] = "EXPECT_DATE_TIME_SKELETON";
  ErrorKind2[ErrorKind2["UNCLOSED_QUOTE_IN_ARGUMENT_STYLE"] = 11] = "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE";
  ErrorKind2[ErrorKind2["EXPECT_SELECT_ARGUMENT_OPTIONS"] = 12] = "EXPECT_SELECT_ARGUMENT_OPTIONS";
  ErrorKind2[ErrorKind2["EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE"] = 13] = "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE";
  ErrorKind2[ErrorKind2["INVALID_PLURAL_ARGUMENT_OFFSET_VALUE"] = 14] = "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE";
  ErrorKind2[ErrorKind2["EXPECT_SELECT_ARGUMENT_SELECTOR"] = 15] = "EXPECT_SELECT_ARGUMENT_SELECTOR";
  ErrorKind2[ErrorKind2["EXPECT_PLURAL_ARGUMENT_SELECTOR"] = 16] = "EXPECT_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind2[ErrorKind2["EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT"] = 17] = "EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT";
  ErrorKind2[ErrorKind2["EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT"] = 18] = "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT";
  ErrorKind2[ErrorKind2["INVALID_PLURAL_ARGUMENT_SELECTOR"] = 19] = "INVALID_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind2[ErrorKind2["DUPLICATE_PLURAL_ARGUMENT_SELECTOR"] = 20] = "DUPLICATE_PLURAL_ARGUMENT_SELECTOR";
  ErrorKind2[ErrorKind2["DUPLICATE_SELECT_ARGUMENT_SELECTOR"] = 21] = "DUPLICATE_SELECT_ARGUMENT_SELECTOR";
  ErrorKind2[ErrorKind2["MISSING_OTHER_CLAUSE"] = 22] = "MISSING_OTHER_CLAUSE";
  ErrorKind2[ErrorKind2["INVALID_TAG"] = 23] = "INVALID_TAG";
  ErrorKind2[ErrorKind2["INVALID_TAG_NAME"] = 25] = "INVALID_TAG_NAME";
  ErrorKind2[ErrorKind2["UNMATCHED_CLOSING_TAG"] = 26] = "UNMATCHED_CLOSING_TAG";
  ErrorKind2[ErrorKind2["UNCLOSED_TAG"] = 27] = "UNCLOSED_TAG";
})(ErrorKind || (ErrorKind = {}));

// ../node_modules/@formatjs/icu-messageformat-parser/lib/types.js
var TYPE;
(function(TYPE2) {
  TYPE2[TYPE2["literal"] = 0] = "literal";
  TYPE2[TYPE2["argument"] = 1] = "argument";
  TYPE2[TYPE2["number"] = 2] = "number";
  TYPE2[TYPE2["date"] = 3] = "date";
  TYPE2[TYPE2["time"] = 4] = "time";
  TYPE2[TYPE2["select"] = 5] = "select";
  TYPE2[TYPE2["plural"] = 6] = "plural";
  TYPE2[TYPE2["pound"] = 7] = "pound";
  TYPE2[TYPE2["tag"] = 8] = "tag";
})(TYPE || (TYPE = {}));
var SKELETON_TYPE;
(function(SKELETON_TYPE2) {
  SKELETON_TYPE2[SKELETON_TYPE2["number"] = 0] = "number";
  SKELETON_TYPE2[SKELETON_TYPE2["dateTime"] = 1] = "dateTime";
})(SKELETON_TYPE || (SKELETON_TYPE = {}));
function isLiteralElement(el) {
  return el.type === TYPE.literal;
}
function isArgumentElement(el) {
  return el.type === TYPE.argument;
}
function isNumberElement(el) {
  return el.type === TYPE.number;
}
function isDateElement(el) {
  return el.type === TYPE.date;
}
function isTimeElement(el) {
  return el.type === TYPE.time;
}
function isSelectElement(el) {
  return el.type === TYPE.select;
}
function isPluralElement(el) {
  return el.type === TYPE.plural;
}
function isPoundElement(el) {
  return el.type === TYPE.pound;
}
function isTagElement(el) {
  return el.type === TYPE.tag;
}
function isNumberSkeleton(el) {
  return !!(el && typeof el === "object" && el.type === SKELETON_TYPE.number);
}
function isDateTimeSkeleton(el) {
  return !!(el && typeof el === "object" && el.type === SKELETON_TYPE.dateTime);
}

// ../node_modules/@formatjs/icu-messageformat-parser/lib/regex.generated.js
var SPACE_SEPARATOR_REGEX = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;

// ../node_modules/@formatjs/icu-skeleton-parser/lib/date-time.js
var DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
function parseDateTimeSkeleton(skeleton) {
  var result = {};
  skeleton.replace(DATE_TIME_REGEX, function(match) {
    var len = match.length;
    switch (match[0]) {
      // Era
      case "G":
        result.era = len === 4 ? "long" : len === 5 ? "narrow" : "short";
        break;
      // Year
      case "y":
        result.year = len === 2 ? "2-digit" : "numeric";
        break;
      case "Y":
      case "u":
      case "U":
      case "r":
        throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");
      // Quarter
      case "q":
      case "Q":
        throw new RangeError("`q/Q` (quarter) patterns are not supported");
      // Month
      case "M":
      case "L":
        result.month = ["numeric", "2-digit", "short", "long", "narrow"][len - 1];
        break;
      // Week
      case "w":
      case "W":
        throw new RangeError("`w/W` (week) patterns are not supported");
      case "d":
        result.day = ["numeric", "2-digit"][len - 1];
        break;
      case "D":
      case "F":
      case "g":
        throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");
      // Weekday
      case "E":
        result.weekday = len === 4 ? "short" : len === 5 ? "narrow" : "short";
        break;
      case "e":
        if (len < 4) {
          throw new RangeError("`e..eee` (weekday) patterns are not supported");
        }
        result.weekday = ["short", "long", "narrow", "short"][len - 4];
        break;
      case "c":
        if (len < 4) {
          throw new RangeError("`c..ccc` (weekday) patterns are not supported");
        }
        result.weekday = ["short", "long", "narrow", "short"][len - 4];
        break;
      // Period
      case "a":
        result.hour12 = true;
        break;
      case "b":
      // am, pm, noon, midnight
      case "B":
        throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");
      // Hour
      case "h":
        result.hourCycle = "h12";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "H":
        result.hourCycle = "h23";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "K":
        result.hourCycle = "h11";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "k":
        result.hourCycle = "h24";
        result.hour = ["numeric", "2-digit"][len - 1];
        break;
      case "j":
      case "J":
      case "C":
        throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");
      // Minute
      case "m":
        result.minute = ["numeric", "2-digit"][len - 1];
        break;
      // Second
      case "s":
        result.second = ["numeric", "2-digit"][len - 1];
        break;
      case "S":
      case "A":
        throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");
      // Zone
      case "z":
        result.timeZoneName = len < 4 ? "short" : "long";
        break;
      case "Z":
      // 1..3, 4, 5: The ISO8601 varios formats
      case "O":
      // 1, 4: miliseconds in day short, long
      case "v":
      // 1, 4: generic non-location format
      case "V":
      // 1, 2, 3, 4: time zone ID or city
      case "X":
      // 1, 2, 3, 4: The ISO8601 varios formats
      case "x":
        throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead");
    }
    return "";
  });
  return result;
}

// ../node_modules/@formatjs/icu-skeleton-parser/lib/regex.generated.js
var WHITE_SPACE_REGEX = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;

// ../node_modules/@formatjs/icu-skeleton-parser/lib/number.js
function parseNumberSkeletonFromString(skeleton) {
  if (skeleton.length === 0) {
    throw new Error("Number skeleton cannot be empty");
  }
  var stringTokens = skeleton.split(WHITE_SPACE_REGEX).filter(function(x) {
    return x.length > 0;
  });
  var tokens = [];
  for (var _i = 0, stringTokens_1 = stringTokens; _i < stringTokens_1.length; _i++) {
    var stringToken = stringTokens_1[_i];
    var stemAndOptions = stringToken.split("/");
    if (stemAndOptions.length === 0) {
      throw new Error("Invalid number skeleton");
    }
    var stem = stemAndOptions[0], options = stemAndOptions.slice(1);
    for (var _a2 = 0, options_1 = options; _a2 < options_1.length; _a2++) {
      var option = options_1[_a2];
      if (option.length === 0) {
        throw new Error("Invalid number skeleton");
      }
    }
    tokens.push({ stem, options });
  }
  return tokens;
}
function icuUnitToEcma(unit) {
  return unit.replace(/^(.*?)-/, "");
}
var FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g;
var SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?[rs]?$/g;
var INTEGER_WIDTH_REGEX = /(\*)(0+)|(#+)(0+)|(0+)/g;
var CONCISE_INTEGER_WIDTH_REGEX = /^(0+)$/;
function parseSignificantPrecision(str) {
  var result = {};
  if (str[str.length - 1] === "r") {
    result.roundingPriority = "morePrecision";
  } else if (str[str.length - 1] === "s") {
    result.roundingPriority = "lessPrecision";
  }
  str.replace(SIGNIFICANT_PRECISION_REGEX, function(_, g1, g2) {
    if (typeof g2 !== "string") {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits = g1.length;
    } else if (g2 === "+") {
      result.minimumSignificantDigits = g1.length;
    } else if (g1[0] === "#") {
      result.maximumSignificantDigits = g1.length;
    } else {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits = g1.length + (typeof g2 === "string" ? g2.length : 0);
    }
    return "";
  });
  return result;
}
function parseSign(str) {
  switch (str) {
    case "sign-auto":
      return {
        signDisplay: "auto"
      };
    case "sign-accounting":
    case "()":
      return {
        currencySign: "accounting"
      };
    case "sign-always":
    case "+!":
      return {
        signDisplay: "always"
      };
    case "sign-accounting-always":
    case "()!":
      return {
        signDisplay: "always",
        currencySign: "accounting"
      };
    case "sign-except-zero":
    case "+?":
      return {
        signDisplay: "exceptZero"
      };
    case "sign-accounting-except-zero":
    case "()?":
      return {
        signDisplay: "exceptZero",
        currencySign: "accounting"
      };
    case "sign-never":
    case "+_":
      return {
        signDisplay: "never"
      };
  }
}
function parseConciseScientificAndEngineeringStem(stem) {
  var result;
  if (stem[0] === "E" && stem[1] === "E") {
    result = {
      notation: "engineering"
    };
    stem = stem.slice(2);
  } else if (stem[0] === "E") {
    result = {
      notation: "scientific"
    };
    stem = stem.slice(1);
  }
  if (result) {
    var signDisplay = stem.slice(0, 2);
    if (signDisplay === "+!") {
      result.signDisplay = "always";
      stem = stem.slice(2);
    } else if (signDisplay === "+?") {
      result.signDisplay = "exceptZero";
      stem = stem.slice(2);
    }
    if (!CONCISE_INTEGER_WIDTH_REGEX.test(stem)) {
      throw new Error("Malformed concise eng/scientific notation");
    }
    result.minimumIntegerDigits = stem.length;
  }
  return result;
}
function parseNotationOptions(opt) {
  var result = {};
  var signOpts = parseSign(opt);
  if (signOpts) {
    return signOpts;
  }
  return result;
}
function parseNumberSkeleton(tokens) {
  var result = {};
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    switch (token.stem) {
      case "percent":
      case "%":
        result.style = "percent";
        continue;
      case "%x100":
        result.style = "percent";
        result.scale = 100;
        continue;
      case "currency":
        result.style = "currency";
        result.currency = token.options[0];
        continue;
      case "group-off":
      case ",_":
        result.useGrouping = false;
        continue;
      case "precision-integer":
      case ".":
        result.maximumFractionDigits = 0;
        continue;
      case "measure-unit":
      case "unit":
        result.style = "unit";
        result.unit = icuUnitToEcma(token.options[0]);
        continue;
      case "compact-short":
      case "K":
        result.notation = "compact";
        result.compactDisplay = "short";
        continue;
      case "compact-long":
      case "KK":
        result.notation = "compact";
        result.compactDisplay = "long";
        continue;
      case "scientific":
        result = __assign(__assign(__assign({}, result), { notation: "scientific" }), token.options.reduce(function(all, opt2) {
          return __assign(__assign({}, all), parseNotationOptions(opt2));
        }, {}));
        continue;
      case "engineering":
        result = __assign(__assign(__assign({}, result), { notation: "engineering" }), token.options.reduce(function(all, opt2) {
          return __assign(__assign({}, all), parseNotationOptions(opt2));
        }, {}));
        continue;
      case "notation-simple":
        result.notation = "standard";
        continue;
      // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
      case "unit-width-narrow":
        result.currencyDisplay = "narrowSymbol";
        result.unitDisplay = "narrow";
        continue;
      case "unit-width-short":
        result.currencyDisplay = "code";
        result.unitDisplay = "short";
        continue;
      case "unit-width-full-name":
        result.currencyDisplay = "name";
        result.unitDisplay = "long";
        continue;
      case "unit-width-iso-code":
        result.currencyDisplay = "symbol";
        continue;
      case "scale":
        result.scale = parseFloat(token.options[0]);
        continue;
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
      case "integer-width":
        if (token.options.length > 1) {
          throw new RangeError("integer-width stems only accept a single optional option");
        }
        token.options[0].replace(INTEGER_WIDTH_REGEX, function(_, g1, g2, g3, g4, g5) {
          if (g1) {
            result.minimumIntegerDigits = g2.length;
          } else if (g3 && g4) {
            throw new Error("We currently do not support maximum integer digits");
          } else if (g5) {
            throw new Error("We currently do not support exact integer digits");
          }
          return "";
        });
        continue;
    }
    if (CONCISE_INTEGER_WIDTH_REGEX.test(token.stem)) {
      result.minimumIntegerDigits = token.stem.length;
      continue;
    }
    if (FRACTION_PRECISION_REGEX.test(token.stem)) {
      if (token.options.length > 1) {
        throw new RangeError("Fraction-precision stems only accept a single optional option");
      }
      token.stem.replace(FRACTION_PRECISION_REGEX, function(_, g1, g2, g3, g4, g5) {
        if (g2 === "*") {
          result.minimumFractionDigits = g1.length;
        } else if (g3 && g3[0] === "#") {
          result.maximumFractionDigits = g3.length;
        } else if (g4 && g5) {
          result.minimumFractionDigits = g4.length;
          result.maximumFractionDigits = g4.length + g5.length;
        } else {
          result.minimumFractionDigits = g1.length;
          result.maximumFractionDigits = g1.length;
        }
        return "";
      });
      var opt = token.options[0];
      if (opt === "w") {
        result = __assign(__assign({}, result), { trailingZeroDisplay: "stripIfInteger" });
      } else if (opt) {
        result = __assign(__assign({}, result), parseSignificantPrecision(opt));
      }
      continue;
    }
    if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
      result = __assign(__assign({}, result), parseSignificantPrecision(token.stem));
      continue;
    }
    var signOpts = parseSign(token.stem);
    if (signOpts) {
      result = __assign(__assign({}, result), signOpts);
    }
    var conciseScientificAndEngineeringOpts = parseConciseScientificAndEngineeringStem(token.stem);
    if (conciseScientificAndEngineeringOpts) {
      result = __assign(__assign({}, result), conciseScientificAndEngineeringOpts);
    }
  }
  return result;
}

// ../node_modules/@formatjs/icu-messageformat-parser/lib/time-data.generated.js
var timeData = {
  "AX": [
    "H"
  ],
  "BQ": [
    "H"
  ],
  "CP": [
    "H"
  ],
  "CZ": [
    "H"
  ],
  "DK": [
    "H"
  ],
  "FI": [
    "H"
  ],
  "ID": [
    "H"
  ],
  "IS": [
    "H"
  ],
  "ML": [
    "H"
  ],
  "NE": [
    "H"
  ],
  "RU": [
    "H"
  ],
  "SE": [
    "H"
  ],
  "SJ": [
    "H"
  ],
  "SK": [
    "H"
  ],
  "AS": [
    "h",
    "H"
  ],
  "BT": [
    "h",
    "H"
  ],
  "DJ": [
    "h",
    "H"
  ],
  "ER": [
    "h",
    "H"
  ],
  "GH": [
    "h",
    "H"
  ],
  "IN": [
    "h",
    "H"
  ],
  "LS": [
    "h",
    "H"
  ],
  "PG": [
    "h",
    "H"
  ],
  "PW": [
    "h",
    "H"
  ],
  "SO": [
    "h",
    "H"
  ],
  "TO": [
    "h",
    "H"
  ],
  "VU": [
    "h",
    "H"
  ],
  "WS": [
    "h",
    "H"
  ],
  "001": [
    "H",
    "h"
  ],
  "AL": [
    "h",
    "H",
    "hB"
  ],
  "TD": [
    "h",
    "H",
    "hB"
  ],
  "ca-ES": [
    "H",
    "h",
    "hB"
  ],
  "CF": [
    "H",
    "h",
    "hB"
  ],
  "CM": [
    "H",
    "h",
    "hB"
  ],
  "fr-CA": [
    "H",
    "h",
    "hB"
  ],
  "gl-ES": [
    "H",
    "h",
    "hB"
  ],
  "it-CH": [
    "H",
    "h",
    "hB"
  ],
  "it-IT": [
    "H",
    "h",
    "hB"
  ],
  "LU": [
    "H",
    "h",
    "hB"
  ],
  "NP": [
    "H",
    "h",
    "hB"
  ],
  "PF": [
    "H",
    "h",
    "hB"
  ],
  "SC": [
    "H",
    "h",
    "hB"
  ],
  "SM": [
    "H",
    "h",
    "hB"
  ],
  "SN": [
    "H",
    "h",
    "hB"
  ],
  "TF": [
    "H",
    "h",
    "hB"
  ],
  "VA": [
    "H",
    "h",
    "hB"
  ],
  "CY": [
    "h",
    "H",
    "hb",
    "hB"
  ],
  "GR": [
    "h",
    "H",
    "hb",
    "hB"
  ],
  "CO": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "DO": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "KP": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "KR": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "NA": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "PA": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "PR": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "VE": [
    "h",
    "H",
    "hB",
    "hb"
  ],
  "AC": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "AI": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "BW": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "BZ": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "CC": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "CK": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "CX": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "DG": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "FK": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "GB": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "GG": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "GI": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "IE": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "IM": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "IO": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "JE": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "LT": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "MK": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "MN": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "MS": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "NF": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "NG": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "NR": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "NU": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "PN": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "SH": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "SX": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "TA": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "ZA": [
    "H",
    "h",
    "hb",
    "hB"
  ],
  "af-ZA": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "AR": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "CL": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "CR": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "CU": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "EA": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-BO": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-BR": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-EC": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-ES": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-GQ": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "es-PE": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "GT": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "HN": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "IC": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "KG": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "KM": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "LK": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "MA": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "MX": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "NI": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "PY": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "SV": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "UY": [
    "H",
    "h",
    "hB",
    "hb"
  ],
  "JP": [
    "H",
    "h",
    "K"
  ],
  "AD": [
    "H",
    "hB"
  ],
  "AM": [
    "H",
    "hB"
  ],
  "AO": [
    "H",
    "hB"
  ],
  "AT": [
    "H",
    "hB"
  ],
  "AW": [
    "H",
    "hB"
  ],
  "BE": [
    "H",
    "hB"
  ],
  "BF": [
    "H",
    "hB"
  ],
  "BJ": [
    "H",
    "hB"
  ],
  "BL": [
    "H",
    "hB"
  ],
  "BR": [
    "H",
    "hB"
  ],
  "CG": [
    "H",
    "hB"
  ],
  "CI": [
    "H",
    "hB"
  ],
  "CV": [
    "H",
    "hB"
  ],
  "DE": [
    "H",
    "hB"
  ],
  "EE": [
    "H",
    "hB"
  ],
  "FR": [
    "H",
    "hB"
  ],
  "GA": [
    "H",
    "hB"
  ],
  "GF": [
    "H",
    "hB"
  ],
  "GN": [
    "H",
    "hB"
  ],
  "GP": [
    "H",
    "hB"
  ],
  "GW": [
    "H",
    "hB"
  ],
  "HR": [
    "H",
    "hB"
  ],
  "IL": [
    "H",
    "hB"
  ],
  "IT": [
    "H",
    "hB"
  ],
  "KZ": [
    "H",
    "hB"
  ],
  "MC": [
    "H",
    "hB"
  ],
  "MD": [
    "H",
    "hB"
  ],
  "MF": [
    "H",
    "hB"
  ],
  "MQ": [
    "H",
    "hB"
  ],
  "MZ": [
    "H",
    "hB"
  ],
  "NC": [
    "H",
    "hB"
  ],
  "NL": [
    "H",
    "hB"
  ],
  "PM": [
    "H",
    "hB"
  ],
  "PT": [
    "H",
    "hB"
  ],
  "RE": [
    "H",
    "hB"
  ],
  "RO": [
    "H",
    "hB"
  ],
  "SI": [
    "H",
    "hB"
  ],
  "SR": [
    "H",
    "hB"
  ],
  "ST": [
    "H",
    "hB"
  ],
  "TG": [
    "H",
    "hB"
  ],
  "TR": [
    "H",
    "hB"
  ],
  "WF": [
    "H",
    "hB"
  ],
  "YT": [
    "H",
    "hB"
  ],
  "BD": [
    "h",
    "hB",
    "H"
  ],
  "PK": [
    "h",
    "hB",
    "H"
  ],
  "AZ": [
    "H",
    "hB",
    "h"
  ],
  "BA": [
    "H",
    "hB",
    "h"
  ],
  "BG": [
    "H",
    "hB",
    "h"
  ],
  "CH": [
    "H",
    "hB",
    "h"
  ],
  "GE": [
    "H",
    "hB",
    "h"
  ],
  "LI": [
    "H",
    "hB",
    "h"
  ],
  "ME": [
    "H",
    "hB",
    "h"
  ],
  "RS": [
    "H",
    "hB",
    "h"
  ],
  "UA": [
    "H",
    "hB",
    "h"
  ],
  "UZ": [
    "H",
    "hB",
    "h"
  ],
  "XK": [
    "H",
    "hB",
    "h"
  ],
  "AG": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "AU": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "BB": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "BM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "BS": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "CA": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "DM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "en-001": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "FJ": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "FM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "GD": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "GM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "GU": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "GY": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "JM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "KI": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "KN": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "KY": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "LC": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "LR": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "MH": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "MP": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "MW": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "NZ": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "SB": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "SG": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "SL": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "SS": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "SZ": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "TC": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "TT": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "UM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "US": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "VC": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "VG": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "VI": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "ZM": [
    "h",
    "hb",
    "H",
    "hB"
  ],
  "BO": [
    "H",
    "hB",
    "h",
    "hb"
  ],
  "EC": [
    "H",
    "hB",
    "h",
    "hb"
  ],
  "ES": [
    "H",
    "hB",
    "h",
    "hb"
  ],
  "GQ": [
    "H",
    "hB",
    "h",
    "hb"
  ],
  "PE": [
    "H",
    "hB",
    "h",
    "hb"
  ],
  "AE": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "ar-001": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "BH": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "DZ": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "EG": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "EH": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "HK": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "IQ": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "JO": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "KW": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "LB": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "LY": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "MO": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "MR": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "OM": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "PH": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "PS": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "QA": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "SA": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "SD": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "SY": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "TN": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "YE": [
    "h",
    "hB",
    "hb",
    "H"
  ],
  "AF": [
    "H",
    "hb",
    "hB",
    "h"
  ],
  "LA": [
    "H",
    "hb",
    "hB",
    "h"
  ],
  "CN": [
    "H",
    "hB",
    "hb",
    "h"
  ],
  "LV": [
    "H",
    "hB",
    "hb",
    "h"
  ],
  "TL": [
    "H",
    "hB",
    "hb",
    "h"
  ],
  "zu-ZA": [
    "H",
    "hB",
    "hb",
    "h"
  ],
  "CD": [
    "hB",
    "H"
  ],
  "IR": [
    "hB",
    "H"
  ],
  "hi-IN": [
    "hB",
    "h",
    "H"
  ],
  "kn-IN": [
    "hB",
    "h",
    "H"
  ],
  "ml-IN": [
    "hB",
    "h",
    "H"
  ],
  "te-IN": [
    "hB",
    "h",
    "H"
  ],
  "KH": [
    "hB",
    "h",
    "H",
    "hb"
  ],
  "ta-IN": [
    "hB",
    "h",
    "hb",
    "H"
  ],
  "BN": [
    "hb",
    "hB",
    "h",
    "H"
  ],
  "MY": [
    "hb",
    "hB",
    "h",
    "H"
  ],
  "ET": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "gu-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "mr-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "pa-IN": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "TW": [
    "hB",
    "hb",
    "h",
    "H"
  ],
  "KE": [
    "hB",
    "hb",
    "H",
    "h"
  ],
  "MM": [
    "hB",
    "hb",
    "H",
    "h"
  ],
  "TZ": [
    "hB",
    "hb",
    "H",
    "h"
  ],
  "UG": [
    "hB",
    "hb",
    "H",
    "h"
  ]
};

// ../node_modules/@formatjs/icu-messageformat-parser/lib/date-time-pattern-generator.js
function getBestPattern(skeleton, locale) {
  var skeletonCopy = "";
  for (var patternPos = 0; patternPos < skeleton.length; patternPos++) {
    var patternChar = skeleton.charAt(patternPos);
    if (patternChar === "j") {
      var extraLength = 0;
      while (patternPos + 1 < skeleton.length && skeleton.charAt(patternPos + 1) === patternChar) {
        extraLength++;
        patternPos++;
      }
      var hourLen = 1 + (extraLength & 1);
      var dayPeriodLen = extraLength < 2 ? 1 : 3 + (extraLength >> 1);
      var dayPeriodChar = "a";
      var hourChar = getDefaultHourSymbolFromLocale(locale);
      if (hourChar == "H" || hourChar == "k") {
        dayPeriodLen = 0;
      }
      while (dayPeriodLen-- > 0) {
        skeletonCopy += dayPeriodChar;
      }
      while (hourLen-- > 0) {
        skeletonCopy = hourChar + skeletonCopy;
      }
    } else if (patternChar === "J") {
      skeletonCopy += "H";
    } else {
      skeletonCopy += patternChar;
    }
  }
  return skeletonCopy;
}
function getDefaultHourSymbolFromLocale(locale) {
  var hourCycle = locale.hourCycle;
  if (hourCycle === void 0 && // @ts-ignore hourCycle(s) is not identified yet
  locale.hourCycles && // @ts-ignore
  locale.hourCycles.length) {
    hourCycle = locale.hourCycles[0];
  }
  if (hourCycle) {
    switch (hourCycle) {
      case "h24":
        return "k";
      case "h23":
        return "H";
      case "h12":
        return "h";
      case "h11":
        return "K";
      default:
        throw new Error("Invalid hourCycle");
    }
  }
  var languageTag = locale.language;
  var regionTag;
  if (languageTag !== "root") {
    regionTag = locale.maximize().region;
  }
  var hourCycles = timeData[regionTag || ""] || timeData[languageTag || ""] || timeData["".concat(languageTag, "-001")] || timeData["001"];
  return hourCycles[0];
}

// ../node_modules/@formatjs/icu-messageformat-parser/lib/parser.js
var _a;
var SPACE_SEPARATOR_START_REGEX = new RegExp("^".concat(SPACE_SEPARATOR_REGEX.source, "*"));
var SPACE_SEPARATOR_END_REGEX = new RegExp("".concat(SPACE_SEPARATOR_REGEX.source, "*$"));
function createLocation(start, end) {
  return { start, end };
}
var hasNativeStartsWith = !!String.prototype.startsWith;
var hasNativeFromCodePoint = !!String.fromCodePoint;
var hasNativeFromEntries = !!Object.fromEntries;
var hasNativeCodePointAt = !!String.prototype.codePointAt;
var hasTrimStart = !!String.prototype.trimStart;
var hasTrimEnd = !!String.prototype.trimEnd;
var hasNativeIsSafeInteger = !!Number.isSafeInteger;
var isSafeInteger = hasNativeIsSafeInteger ? Number.isSafeInteger : function(n) {
  return typeof n === "number" && isFinite(n) && Math.floor(n) === n && Math.abs(n) <= 9007199254740991;
};
var REGEX_SUPPORTS_U_AND_Y = true;
try {
  re = RE("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu");
  REGEX_SUPPORTS_U_AND_Y = ((_a = re.exec("a")) === null || _a === void 0 ? void 0 : _a[0]) === "a";
} catch (_) {
  REGEX_SUPPORTS_U_AND_Y = false;
}
var re;
var startsWith = hasNativeStartsWith ? (
  // Native
  function startsWith2(s, search, position) {
    return s.startsWith(search, position);
  }
) : (
  // For IE11
  function startsWith3(s, search, position) {
    return s.slice(position, position + search.length) === search;
  }
);
var fromCodePoint = hasNativeFromCodePoint ? String.fromCodePoint : (
  // IE11
  function fromCodePoint2() {
    var codePoints = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      codePoints[_i] = arguments[_i];
    }
    var elements = "";
    var length = codePoints.length;
    var i = 0;
    var code;
    while (length > i) {
      code = codePoints[i++];
      if (code > 1114111)
        throw RangeError(code + " is not a valid code point");
      elements += code < 65536 ? String.fromCharCode(code) : String.fromCharCode(((code -= 65536) >> 10) + 55296, code % 1024 + 56320);
    }
    return elements;
  }
);
var fromEntries = (
  // native
  hasNativeFromEntries ? Object.fromEntries : (
    // Ponyfill
    function fromEntries2(entries) {
      var obj = {};
      for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var _a2 = entries_1[_i], k = _a2[0], v = _a2[1];
        obj[k] = v;
      }
      return obj;
    }
  )
);
var codePointAt = hasNativeCodePointAt ? (
  // Native
  function codePointAt2(s, index) {
    return s.codePointAt(index);
  }
) : (
  // IE 11
  function codePointAt3(s, index) {
    var size = s.length;
    if (index < 0 || index >= size) {
      return void 0;
    }
    var first = s.charCodeAt(index);
    var second;
    return first < 55296 || first > 56319 || index + 1 === size || (second = s.charCodeAt(index + 1)) < 56320 || second > 57343 ? first : (first - 55296 << 10) + (second - 56320) + 65536;
  }
);
var trimStart = hasTrimStart ? (
  // Native
  function trimStart2(s) {
    return s.trimStart();
  }
) : (
  // Ponyfill
  function trimStart3(s) {
    return s.replace(SPACE_SEPARATOR_START_REGEX, "");
  }
);
var trimEnd = hasTrimEnd ? (
  // Native
  function trimEnd2(s) {
    return s.trimEnd();
  }
) : (
  // Ponyfill
  function trimEnd3(s) {
    return s.replace(SPACE_SEPARATOR_END_REGEX, "");
  }
);
function RE(s, flag) {
  return new RegExp(s, flag);
}
var matchIdentifierAtIndex;
if (REGEX_SUPPORTS_U_AND_Y) {
  IDENTIFIER_PREFIX_RE_1 = RE("([^\\p{White_Space}\\p{Pattern_Syntax}]*)", "yu");
  matchIdentifierAtIndex = function matchIdentifierAtIndex2(s, index) {
    var _a2;
    IDENTIFIER_PREFIX_RE_1.lastIndex = index;
    var match = IDENTIFIER_PREFIX_RE_1.exec(s);
    return (_a2 = match[1]) !== null && _a2 !== void 0 ? _a2 : "";
  };
} else {
  matchIdentifierAtIndex = function matchIdentifierAtIndex2(s, index) {
    var match = [];
    while (true) {
      var c = codePointAt(s, index);
      if (c === void 0 || _isWhiteSpace(c) || _isPatternSyntax(c)) {
        break;
      }
      match.push(c);
      index += c >= 65536 ? 2 : 1;
    }
    return fromCodePoint.apply(void 0, match);
  };
}
var IDENTIFIER_PREFIX_RE_1;
var Parser = (
  /** @class */
  function() {
    function Parser2(message, options) {
      if (options === void 0) {
        options = {};
      }
      this.message = message;
      this.position = { offset: 0, line: 1, column: 1 };
      this.ignoreTag = !!options.ignoreTag;
      this.locale = options.locale;
      this.requiresOtherClause = !!options.requiresOtherClause;
      this.shouldParseSkeletons = !!options.shouldParseSkeletons;
    }
    Parser2.prototype.parse = function() {
      if (this.offset() !== 0) {
        throw Error("parser can only be used once");
      }
      return this.parseMessage(0, "", false);
    };
    Parser2.prototype.parseMessage = function(nestingLevel, parentArgType, expectingCloseTag) {
      var elements = [];
      while (!this.isEOF()) {
        var char = this.char();
        if (char === 123) {
          var result = this.parseArgument(nestingLevel, expectingCloseTag);
          if (result.err) {
            return result;
          }
          elements.push(result.val);
        } else if (char === 125 && nestingLevel > 0) {
          break;
        } else if (char === 35 && (parentArgType === "plural" || parentArgType === "selectordinal")) {
          var position = this.clonePosition();
          this.bump();
          elements.push({
            type: TYPE.pound,
            location: createLocation(position, this.clonePosition())
          });
        } else if (char === 60 && !this.ignoreTag && this.peek() === 47) {
          if (expectingCloseTag) {
            break;
          } else {
            return this.error(ErrorKind.UNMATCHED_CLOSING_TAG, createLocation(this.clonePosition(), this.clonePosition()));
          }
        } else if (char === 60 && !this.ignoreTag && _isAlpha(this.peek() || 0)) {
          var result = this.parseTag(nestingLevel, parentArgType);
          if (result.err) {
            return result;
          }
          elements.push(result.val);
        } else {
          var result = this.parseLiteral(nestingLevel, parentArgType);
          if (result.err) {
            return result;
          }
          elements.push(result.val);
        }
      }
      return { val: elements, err: null };
    };
    Parser2.prototype.parseTag = function(nestingLevel, parentArgType) {
      var startPosition = this.clonePosition();
      this.bump();
      var tagName = this.parseTagName();
      this.bumpSpace();
      if (this.bumpIf("/>")) {
        return {
          val: {
            type: TYPE.literal,
            value: "<".concat(tagName, "/>"),
            location: createLocation(startPosition, this.clonePosition())
          },
          err: null
        };
      } else if (this.bumpIf(">")) {
        var childrenResult = this.parseMessage(nestingLevel + 1, parentArgType, true);
        if (childrenResult.err) {
          return childrenResult;
        }
        var children = childrenResult.val;
        var endTagStartPosition = this.clonePosition();
        if (this.bumpIf("</")) {
          if (this.isEOF() || !_isAlpha(this.char())) {
            return this.error(ErrorKind.INVALID_TAG, createLocation(endTagStartPosition, this.clonePosition()));
          }
          var closingTagNameStartPosition = this.clonePosition();
          var closingTagName = this.parseTagName();
          if (tagName !== closingTagName) {
            return this.error(ErrorKind.UNMATCHED_CLOSING_TAG, createLocation(closingTagNameStartPosition, this.clonePosition()));
          }
          this.bumpSpace();
          if (!this.bumpIf(">")) {
            return this.error(ErrorKind.INVALID_TAG, createLocation(endTagStartPosition, this.clonePosition()));
          }
          return {
            val: {
              type: TYPE.tag,
              value: tagName,
              children,
              location: createLocation(startPosition, this.clonePosition())
            },
            err: null
          };
        } else {
          return this.error(ErrorKind.UNCLOSED_TAG, createLocation(startPosition, this.clonePosition()));
        }
      } else {
        return this.error(ErrorKind.INVALID_TAG, createLocation(startPosition, this.clonePosition()));
      }
    };
    Parser2.prototype.parseTagName = function() {
      var startOffset = this.offset();
      this.bump();
      while (!this.isEOF() && _isPotentialElementNameChar(this.char())) {
        this.bump();
      }
      return this.message.slice(startOffset, this.offset());
    };
    Parser2.prototype.parseLiteral = function(nestingLevel, parentArgType) {
      var start = this.clonePosition();
      var value = "";
      while (true) {
        var parseQuoteResult = this.tryParseQuote(parentArgType);
        if (parseQuoteResult) {
          value += parseQuoteResult;
          continue;
        }
        var parseUnquotedResult = this.tryParseUnquoted(nestingLevel, parentArgType);
        if (parseUnquotedResult) {
          value += parseUnquotedResult;
          continue;
        }
        var parseLeftAngleResult = this.tryParseLeftAngleBracket();
        if (parseLeftAngleResult) {
          value += parseLeftAngleResult;
          continue;
        }
        break;
      }
      var location = createLocation(start, this.clonePosition());
      return {
        val: { type: TYPE.literal, value, location },
        err: null
      };
    };
    Parser2.prototype.tryParseLeftAngleBracket = function() {
      if (!this.isEOF() && this.char() === 60 && (this.ignoreTag || // If at the opening tag or closing tag position, bail.
      !_isAlphaOrSlash(this.peek() || 0))) {
        this.bump();
        return "<";
      }
      return null;
    };
    Parser2.prototype.tryParseQuote = function(parentArgType) {
      if (this.isEOF() || this.char() !== 39) {
        return null;
      }
      switch (this.peek()) {
        case 39:
          this.bump();
          this.bump();
          return "'";
        // '{', '<', '>', '}'
        case 123:
        case 60:
        case 62:
        case 125:
          break;
        case 35:
          if (parentArgType === "plural" || parentArgType === "selectordinal") {
            break;
          }
          return null;
        default:
          return null;
      }
      this.bump();
      var codePoints = [this.char()];
      this.bump();
      while (!this.isEOF()) {
        var ch = this.char();
        if (ch === 39) {
          if (this.peek() === 39) {
            codePoints.push(39);
            this.bump();
          } else {
            this.bump();
            break;
          }
        } else {
          codePoints.push(ch);
        }
        this.bump();
      }
      return fromCodePoint.apply(void 0, codePoints);
    };
    Parser2.prototype.tryParseUnquoted = function(nestingLevel, parentArgType) {
      if (this.isEOF()) {
        return null;
      }
      var ch = this.char();
      if (ch === 60 || ch === 123 || ch === 35 && (parentArgType === "plural" || parentArgType === "selectordinal") || ch === 125 && nestingLevel > 0) {
        return null;
      } else {
        this.bump();
        return fromCodePoint(ch);
      }
    };
    Parser2.prototype.parseArgument = function(nestingLevel, expectingCloseTag) {
      var openingBracePosition = this.clonePosition();
      this.bump();
      this.bumpSpace();
      if (this.isEOF()) {
        return this.error(ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE, createLocation(openingBracePosition, this.clonePosition()));
      }
      if (this.char() === 125) {
        this.bump();
        return this.error(ErrorKind.EMPTY_ARGUMENT, createLocation(openingBracePosition, this.clonePosition()));
      }
      var value = this.parseIdentifierIfPossible().value;
      if (!value) {
        return this.error(ErrorKind.MALFORMED_ARGUMENT, createLocation(openingBracePosition, this.clonePosition()));
      }
      this.bumpSpace();
      if (this.isEOF()) {
        return this.error(ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE, createLocation(openingBracePosition, this.clonePosition()));
      }
      switch (this.char()) {
        // Simple argument: `{name}`
        case 125: {
          this.bump();
          return {
            val: {
              type: TYPE.argument,
              // value does not include the opening and closing braces.
              value,
              location: createLocation(openingBracePosition, this.clonePosition())
            },
            err: null
          };
        }
        // Argument with options: `{name, format, ...}`
        case 44: {
          this.bump();
          this.bumpSpace();
          if (this.isEOF()) {
            return this.error(ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE, createLocation(openingBracePosition, this.clonePosition()));
          }
          return this.parseArgumentOptions(nestingLevel, expectingCloseTag, value, openingBracePosition);
        }
        default:
          return this.error(ErrorKind.MALFORMED_ARGUMENT, createLocation(openingBracePosition, this.clonePosition()));
      }
    };
    Parser2.prototype.parseIdentifierIfPossible = function() {
      var startingPosition = this.clonePosition();
      var startOffset = this.offset();
      var value = matchIdentifierAtIndex(this.message, startOffset);
      var endOffset = startOffset + value.length;
      this.bumpTo(endOffset);
      var endPosition = this.clonePosition();
      var location = createLocation(startingPosition, endPosition);
      return { value, location };
    };
    Parser2.prototype.parseArgumentOptions = function(nestingLevel, expectingCloseTag, value, openingBracePosition) {
      var _a2;
      var typeStartPosition = this.clonePosition();
      var argType = this.parseIdentifierIfPossible().value;
      var typeEndPosition = this.clonePosition();
      switch (argType) {
        case "":
          return this.error(ErrorKind.EXPECT_ARGUMENT_TYPE, createLocation(typeStartPosition, typeEndPosition));
        case "number":
        case "date":
        case "time": {
          this.bumpSpace();
          var styleAndLocation = null;
          if (this.bumpIf(",")) {
            this.bumpSpace();
            var styleStartPosition = this.clonePosition();
            var result = this.parseSimpleArgStyleIfPossible();
            if (result.err) {
              return result;
            }
            var style = trimEnd(result.val);
            if (style.length === 0) {
              return this.error(ErrorKind.EXPECT_ARGUMENT_STYLE, createLocation(this.clonePosition(), this.clonePosition()));
            }
            var styleLocation = createLocation(styleStartPosition, this.clonePosition());
            styleAndLocation = { style, styleLocation };
          }
          var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
          if (argCloseResult.err) {
            return argCloseResult;
          }
          var location_1 = createLocation(openingBracePosition, this.clonePosition());
          if (styleAndLocation && startsWith(styleAndLocation === null || styleAndLocation === void 0 ? void 0 : styleAndLocation.style, "::", 0)) {
            var skeleton = trimStart(styleAndLocation.style.slice(2));
            if (argType === "number") {
              var result = this.parseNumberSkeletonFromString(skeleton, styleAndLocation.styleLocation);
              if (result.err) {
                return result;
              }
              return {
                val: { type: TYPE.number, value, location: location_1, style: result.val },
                err: null
              };
            } else {
              if (skeleton.length === 0) {
                return this.error(ErrorKind.EXPECT_DATE_TIME_SKELETON, location_1);
              }
              var dateTimePattern = skeleton;
              if (this.locale) {
                dateTimePattern = getBestPattern(skeleton, this.locale);
              }
              var style = {
                type: SKELETON_TYPE.dateTime,
                pattern: dateTimePattern,
                location: styleAndLocation.styleLocation,
                parsedOptions: this.shouldParseSkeletons ? parseDateTimeSkeleton(dateTimePattern) : {}
              };
              var type = argType === "date" ? TYPE.date : TYPE.time;
              return {
                val: { type, value, location: location_1, style },
                err: null
              };
            }
          }
          return {
            val: {
              type: argType === "number" ? TYPE.number : argType === "date" ? TYPE.date : TYPE.time,
              value,
              location: location_1,
              style: (_a2 = styleAndLocation === null || styleAndLocation === void 0 ? void 0 : styleAndLocation.style) !== null && _a2 !== void 0 ? _a2 : null
            },
            err: null
          };
        }
        case "plural":
        case "selectordinal":
        case "select": {
          var typeEndPosition_1 = this.clonePosition();
          this.bumpSpace();
          if (!this.bumpIf(",")) {
            return this.error(ErrorKind.EXPECT_SELECT_ARGUMENT_OPTIONS, createLocation(typeEndPosition_1, __assign({}, typeEndPosition_1)));
          }
          this.bumpSpace();
          var identifierAndLocation = this.parseIdentifierIfPossible();
          var pluralOffset = 0;
          if (argType !== "select" && identifierAndLocation.value === "offset") {
            if (!this.bumpIf(":")) {
              return this.error(ErrorKind.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, createLocation(this.clonePosition(), this.clonePosition()));
            }
            this.bumpSpace();
            var result = this.tryParseDecimalInteger(ErrorKind.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE, ErrorKind.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE);
            if (result.err) {
              return result;
            }
            this.bumpSpace();
            identifierAndLocation = this.parseIdentifierIfPossible();
            pluralOffset = result.val;
          }
          var optionsResult = this.tryParsePluralOrSelectOptions(nestingLevel, argType, expectingCloseTag, identifierAndLocation);
          if (optionsResult.err) {
            return optionsResult;
          }
          var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
          if (argCloseResult.err) {
            return argCloseResult;
          }
          var location_2 = createLocation(openingBracePosition, this.clonePosition());
          if (argType === "select") {
            return {
              val: {
                type: TYPE.select,
                value,
                options: fromEntries(optionsResult.val),
                location: location_2
              },
              err: null
            };
          } else {
            return {
              val: {
                type: TYPE.plural,
                value,
                options: fromEntries(optionsResult.val),
                offset: pluralOffset,
                pluralType: argType === "plural" ? "cardinal" : "ordinal",
                location: location_2
              },
              err: null
            };
          }
        }
        default:
          return this.error(ErrorKind.INVALID_ARGUMENT_TYPE, createLocation(typeStartPosition, typeEndPosition));
      }
    };
    Parser2.prototype.tryParseArgumentClose = function(openingBracePosition) {
      if (this.isEOF() || this.char() !== 125) {
        return this.error(ErrorKind.EXPECT_ARGUMENT_CLOSING_BRACE, createLocation(openingBracePosition, this.clonePosition()));
      }
      this.bump();
      return { val: true, err: null };
    };
    Parser2.prototype.parseSimpleArgStyleIfPossible = function() {
      var nestedBraces = 0;
      var startPosition = this.clonePosition();
      while (!this.isEOF()) {
        var ch = this.char();
        switch (ch) {
          case 39: {
            this.bump();
            var apostrophePosition = this.clonePosition();
            if (!this.bumpUntil("'")) {
              return this.error(ErrorKind.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE, createLocation(apostrophePosition, this.clonePosition()));
            }
            this.bump();
            break;
          }
          case 123: {
            nestedBraces += 1;
            this.bump();
            break;
          }
          case 125: {
            if (nestedBraces > 0) {
              nestedBraces -= 1;
            } else {
              return {
                val: this.message.slice(startPosition.offset, this.offset()),
                err: null
              };
            }
            break;
          }
          default:
            this.bump();
            break;
        }
      }
      return {
        val: this.message.slice(startPosition.offset, this.offset()),
        err: null
      };
    };
    Parser2.prototype.parseNumberSkeletonFromString = function(skeleton, location) {
      var tokens = [];
      try {
        tokens = parseNumberSkeletonFromString(skeleton);
      } catch (e) {
        return this.error(ErrorKind.INVALID_NUMBER_SKELETON, location);
      }
      return {
        val: {
          type: SKELETON_TYPE.number,
          tokens,
          location,
          parsedOptions: this.shouldParseSkeletons ? parseNumberSkeleton(tokens) : {}
        },
        err: null
      };
    };
    Parser2.prototype.tryParsePluralOrSelectOptions = function(nestingLevel, parentArgType, expectCloseTag, parsedFirstIdentifier) {
      var _a2;
      var hasOtherClause = false;
      var options = [];
      var parsedSelectors = /* @__PURE__ */ new Set();
      var selector = parsedFirstIdentifier.value, selectorLocation = parsedFirstIdentifier.location;
      while (true) {
        if (selector.length === 0) {
          var startPosition = this.clonePosition();
          if (parentArgType !== "select" && this.bumpIf("=")) {
            var result = this.tryParseDecimalInteger(ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR, ErrorKind.INVALID_PLURAL_ARGUMENT_SELECTOR);
            if (result.err) {
              return result;
            }
            selectorLocation = createLocation(startPosition, this.clonePosition());
            selector = this.message.slice(startPosition.offset, this.offset());
          } else {
            break;
          }
        }
        if (parsedSelectors.has(selector)) {
          return this.error(parentArgType === "select" ? ErrorKind.DUPLICATE_SELECT_ARGUMENT_SELECTOR : ErrorKind.DUPLICATE_PLURAL_ARGUMENT_SELECTOR, selectorLocation);
        }
        if (selector === "other") {
          hasOtherClause = true;
        }
        this.bumpSpace();
        var openingBracePosition = this.clonePosition();
        if (!this.bumpIf("{")) {
          return this.error(parentArgType === "select" ? ErrorKind.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT : ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT, createLocation(this.clonePosition(), this.clonePosition()));
        }
        var fragmentResult = this.parseMessage(nestingLevel + 1, parentArgType, expectCloseTag);
        if (fragmentResult.err) {
          return fragmentResult;
        }
        var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
        if (argCloseResult.err) {
          return argCloseResult;
        }
        options.push([
          selector,
          {
            value: fragmentResult.val,
            location: createLocation(openingBracePosition, this.clonePosition())
          }
        ]);
        parsedSelectors.add(selector);
        this.bumpSpace();
        _a2 = this.parseIdentifierIfPossible(), selector = _a2.value, selectorLocation = _a2.location;
      }
      if (options.length === 0) {
        return this.error(parentArgType === "select" ? ErrorKind.EXPECT_SELECT_ARGUMENT_SELECTOR : ErrorKind.EXPECT_PLURAL_ARGUMENT_SELECTOR, createLocation(this.clonePosition(), this.clonePosition()));
      }
      if (this.requiresOtherClause && !hasOtherClause) {
        return this.error(ErrorKind.MISSING_OTHER_CLAUSE, createLocation(this.clonePosition(), this.clonePosition()));
      }
      return { val: options, err: null };
    };
    Parser2.prototype.tryParseDecimalInteger = function(expectNumberError, invalidNumberError) {
      var sign = 1;
      var startingPosition = this.clonePosition();
      if (this.bumpIf("+")) {
      } else if (this.bumpIf("-")) {
        sign = -1;
      }
      var hasDigits = false;
      var decimal = 0;
      while (!this.isEOF()) {
        var ch = this.char();
        if (ch >= 48 && ch <= 57) {
          hasDigits = true;
          decimal = decimal * 10 + (ch - 48);
          this.bump();
        } else {
          break;
        }
      }
      var location = createLocation(startingPosition, this.clonePosition());
      if (!hasDigits) {
        return this.error(expectNumberError, location);
      }
      decimal *= sign;
      if (!isSafeInteger(decimal)) {
        return this.error(invalidNumberError, location);
      }
      return { val: decimal, err: null };
    };
    Parser2.prototype.offset = function() {
      return this.position.offset;
    };
    Parser2.prototype.isEOF = function() {
      return this.offset() === this.message.length;
    };
    Parser2.prototype.clonePosition = function() {
      return {
        offset: this.position.offset,
        line: this.position.line,
        column: this.position.column
      };
    };
    Parser2.prototype.char = function() {
      var offset = this.position.offset;
      if (offset >= this.message.length) {
        throw Error("out of bound");
      }
      var code = codePointAt(this.message, offset);
      if (code === void 0) {
        throw Error("Offset ".concat(offset, " is at invalid UTF-16 code unit boundary"));
      }
      return code;
    };
    Parser2.prototype.error = function(kind, location) {
      return {
        val: null,
        err: {
          kind,
          message: this.message,
          location
        }
      };
    };
    Parser2.prototype.bump = function() {
      if (this.isEOF()) {
        return;
      }
      var code = this.char();
      if (code === 10) {
        this.position.line += 1;
        this.position.column = 1;
        this.position.offset += 1;
      } else {
        this.position.column += 1;
        this.position.offset += code < 65536 ? 1 : 2;
      }
    };
    Parser2.prototype.bumpIf = function(prefix) {
      if (startsWith(this.message, prefix, this.offset())) {
        for (var i = 0; i < prefix.length; i++) {
          this.bump();
        }
        return true;
      }
      return false;
    };
    Parser2.prototype.bumpUntil = function(pattern) {
      var currentOffset = this.offset();
      var index = this.message.indexOf(pattern, currentOffset);
      if (index >= 0) {
        this.bumpTo(index);
        return true;
      } else {
        this.bumpTo(this.message.length);
        return false;
      }
    };
    Parser2.prototype.bumpTo = function(targetOffset) {
      if (this.offset() > targetOffset) {
        throw Error("targetOffset ".concat(targetOffset, " must be greater than or equal to the current offset ").concat(this.offset()));
      }
      targetOffset = Math.min(targetOffset, this.message.length);
      while (true) {
        var offset = this.offset();
        if (offset === targetOffset) {
          break;
        }
        if (offset > targetOffset) {
          throw Error("targetOffset ".concat(targetOffset, " is at invalid UTF-16 code unit boundary"));
        }
        this.bump();
        if (this.isEOF()) {
          break;
        }
      }
    };
    Parser2.prototype.bumpSpace = function() {
      while (!this.isEOF() && _isWhiteSpace(this.char())) {
        this.bump();
      }
    };
    Parser2.prototype.peek = function() {
      if (this.isEOF()) {
        return null;
      }
      var code = this.char();
      var offset = this.offset();
      var nextCode = this.message.charCodeAt(offset + (code >= 65536 ? 2 : 1));
      return nextCode !== null && nextCode !== void 0 ? nextCode : null;
    };
    return Parser2;
  }()
);
function _isAlpha(codepoint) {
  return codepoint >= 97 && codepoint <= 122 || codepoint >= 65 && codepoint <= 90;
}
function _isAlphaOrSlash(codepoint) {
  return _isAlpha(codepoint) || codepoint === 47;
}
function _isPotentialElementNameChar(c) {
  return c === 45 || c === 46 || c >= 48 && c <= 57 || c === 95 || c >= 97 && c <= 122 || c >= 65 && c <= 90 || c == 183 || c >= 192 && c <= 214 || c >= 216 && c <= 246 || c >= 248 && c <= 893 || c >= 895 && c <= 8191 || c >= 8204 && c <= 8205 || c >= 8255 && c <= 8256 || c >= 8304 && c <= 8591 || c >= 11264 && c <= 12271 || c >= 12289 && c <= 55295 || c >= 63744 && c <= 64975 || c >= 65008 && c <= 65533 || c >= 65536 && c <= 983039;
}
function _isWhiteSpace(c) {
  return c >= 9 && c <= 13 || c === 32 || c === 133 || c >= 8206 && c <= 8207 || c === 8232 || c === 8233;
}
function _isPatternSyntax(c) {
  return c >= 33 && c <= 35 || c === 36 || c >= 37 && c <= 39 || c === 40 || c === 41 || c === 42 || c === 43 || c === 44 || c === 45 || c >= 46 && c <= 47 || c >= 58 && c <= 59 || c >= 60 && c <= 62 || c >= 63 && c <= 64 || c === 91 || c === 92 || c === 93 || c === 94 || c === 96 || c === 123 || c === 124 || c === 125 || c === 126 || c === 161 || c >= 162 && c <= 165 || c === 166 || c === 167 || c === 169 || c === 171 || c === 172 || c === 174 || c === 176 || c === 177 || c === 182 || c === 187 || c === 191 || c === 215 || c === 247 || c >= 8208 && c <= 8213 || c >= 8214 && c <= 8215 || c === 8216 || c === 8217 || c === 8218 || c >= 8219 && c <= 8220 || c === 8221 || c === 8222 || c === 8223 || c >= 8224 && c <= 8231 || c >= 8240 && c <= 8248 || c === 8249 || c === 8250 || c >= 8251 && c <= 8254 || c >= 8257 && c <= 8259 || c === 8260 || c === 8261 || c === 8262 || c >= 8263 && c <= 8273 || c === 8274 || c === 8275 || c >= 8277 && c <= 8286 || c >= 8592 && c <= 8596 || c >= 8597 && c <= 8601 || c >= 8602 && c <= 8603 || c >= 8604 && c <= 8607 || c === 8608 || c >= 8609 && c <= 8610 || c === 8611 || c >= 8612 && c <= 8613 || c === 8614 || c >= 8615 && c <= 8621 || c === 8622 || c >= 8623 && c <= 8653 || c >= 8654 && c <= 8655 || c >= 8656 && c <= 8657 || c === 8658 || c === 8659 || c === 8660 || c >= 8661 && c <= 8691 || c >= 8692 && c <= 8959 || c >= 8960 && c <= 8967 || c === 8968 || c === 8969 || c === 8970 || c === 8971 || c >= 8972 && c <= 8991 || c >= 8992 && c <= 8993 || c >= 8994 && c <= 9e3 || c === 9001 || c === 9002 || c >= 9003 && c <= 9083 || c === 9084 || c >= 9085 && c <= 9114 || c >= 9115 && c <= 9139 || c >= 9140 && c <= 9179 || c >= 9180 && c <= 9185 || c >= 9186 && c <= 9254 || c >= 9255 && c <= 9279 || c >= 9280 && c <= 9290 || c >= 9291 && c <= 9311 || c >= 9472 && c <= 9654 || c === 9655 || c >= 9656 && c <= 9664 || c === 9665 || c >= 9666 && c <= 9719 || c >= 9720 && c <= 9727 || c >= 9728 && c <= 9838 || c === 9839 || c >= 9840 && c <= 10087 || c === 10088 || c === 10089 || c === 10090 || c === 10091 || c === 10092 || c === 10093 || c === 10094 || c === 10095 || c === 10096 || c === 10097 || c === 10098 || c === 10099 || c === 10100 || c === 10101 || c >= 10132 && c <= 10175 || c >= 10176 && c <= 10180 || c === 10181 || c === 10182 || c >= 10183 && c <= 10213 || c === 10214 || c === 10215 || c === 10216 || c === 10217 || c === 10218 || c === 10219 || c === 10220 || c === 10221 || c === 10222 || c === 10223 || c >= 10224 && c <= 10239 || c >= 10240 && c <= 10495 || c >= 10496 && c <= 10626 || c === 10627 || c === 10628 || c === 10629 || c === 10630 || c === 10631 || c === 10632 || c === 10633 || c === 10634 || c === 10635 || c === 10636 || c === 10637 || c === 10638 || c === 10639 || c === 10640 || c === 10641 || c === 10642 || c === 10643 || c === 10644 || c === 10645 || c === 10646 || c === 10647 || c === 10648 || c >= 10649 && c <= 10711 || c === 10712 || c === 10713 || c === 10714 || c === 10715 || c >= 10716 && c <= 10747 || c === 10748 || c === 10749 || c >= 10750 && c <= 11007 || c >= 11008 && c <= 11055 || c >= 11056 && c <= 11076 || c >= 11077 && c <= 11078 || c >= 11079 && c <= 11084 || c >= 11085 && c <= 11123 || c >= 11124 && c <= 11125 || c >= 11126 && c <= 11157 || c === 11158 || c >= 11159 && c <= 11263 || c >= 11776 && c <= 11777 || c === 11778 || c === 11779 || c === 11780 || c === 11781 || c >= 11782 && c <= 11784 || c === 11785 || c === 11786 || c === 11787 || c === 11788 || c === 11789 || c >= 11790 && c <= 11798 || c === 11799 || c >= 11800 && c <= 11801 || c === 11802 || c === 11803 || c === 11804 || c === 11805 || c >= 11806 && c <= 11807 || c === 11808 || c === 11809 || c === 11810 || c === 11811 || c === 11812 || c === 11813 || c === 11814 || c === 11815 || c === 11816 || c === 11817 || c >= 11818 && c <= 11822 || c === 11823 || c >= 11824 && c <= 11833 || c >= 11834 && c <= 11835 || c >= 11836 && c <= 11839 || c === 11840 || c === 11841 || c === 11842 || c >= 11843 && c <= 11855 || c >= 11856 && c <= 11857 || c === 11858 || c >= 11859 && c <= 11903 || c >= 12289 && c <= 12291 || c === 12296 || c === 12297 || c === 12298 || c === 12299 || c === 12300 || c === 12301 || c === 12302 || c === 12303 || c === 12304 || c === 12305 || c >= 12306 && c <= 12307 || c === 12308 || c === 12309 || c === 12310 || c === 12311 || c === 12312 || c === 12313 || c === 12314 || c === 12315 || c === 12316 || c === 12317 || c >= 12318 && c <= 12319 || c === 12320 || c === 12336 || c === 64830 || c === 64831 || c >= 65093 && c <= 65094;
}

// ../node_modules/@formatjs/icu-messageformat-parser/lib/index.js
function pruneLocation(els) {
  els.forEach(function(el) {
    delete el.location;
    if (isSelectElement(el) || isPluralElement(el)) {
      for (var k in el.options) {
        delete el.options[k].location;
        pruneLocation(el.options[k].value);
      }
    } else if (isNumberElement(el) && isNumberSkeleton(el.style)) {
      delete el.style.location;
    } else if ((isDateElement(el) || isTimeElement(el)) && isDateTimeSkeleton(el.style)) {
      delete el.style.location;
    } else if (isTagElement(el)) {
      pruneLocation(el.children);
    }
  });
}
function parse(message, opts) {
  if (opts === void 0) {
    opts = {};
  }
  opts = __assign({ shouldParseSkeletons: true, requiresOtherClause: true }, opts);
  var result = new Parser(message, opts).parse();
  if (result.err) {
    var error = SyntaxError(ErrorKind[result.err.kind]);
    error.location = result.err.location;
    error.originalMessage = result.err.message;
    throw error;
  }
  if (!(opts === null || opts === void 0 ? void 0 : opts.captureLocation)) {
    pruneLocation(result.val);
  }
  return result.val;
}

// ../node_modules/@formatjs/fast-memoize/lib/index.js
function memoize(fn, options) {
  var cache = options && options.cache ? options.cache : cacheDefault;
  var serializer = options && options.serializer ? options.serializer : serializerDefault;
  var strategy = options && options.strategy ? options.strategy : strategyDefault;
  return strategy(fn, {
    cache,
    serializer
  });
}
function isPrimitive(value) {
  return value == null || typeof value === "number" || typeof value === "boolean";
}
function monadic(fn, cache, serializer, arg) {
  var cacheKey = isPrimitive(arg) ? arg : serializer(arg);
  var computedValue = cache.get(cacheKey);
  if (typeof computedValue === "undefined") {
    computedValue = fn.call(this, arg);
    cache.set(cacheKey, computedValue);
  }
  return computedValue;
}
function variadic(fn, cache, serializer) {
  var args = Array.prototype.slice.call(arguments, 3);
  var cacheKey = serializer(args);
  var computedValue = cache.get(cacheKey);
  if (typeof computedValue === "undefined") {
    computedValue = fn.apply(this, args);
    cache.set(cacheKey, computedValue);
  }
  return computedValue;
}
function assemble(fn, context, strategy, cache, serialize) {
  return strategy.bind(context, fn, cache, serialize);
}
function strategyDefault(fn, options) {
  var strategy = fn.length === 1 ? monadic : variadic;
  return assemble(fn, this, strategy, options.cache.create(), options.serializer);
}
function strategyVariadic(fn, options) {
  return assemble(fn, this, variadic, options.cache.create(), options.serializer);
}
function strategyMonadic(fn, options) {
  return assemble(fn, this, monadic, options.cache.create(), options.serializer);
}
var serializerDefault = function() {
  return JSON.stringify(arguments);
};
function ObjectWithoutPrototypeCache() {
  this.cache = /* @__PURE__ */ Object.create(null);
}
ObjectWithoutPrototypeCache.prototype.get = function(key) {
  return this.cache[key];
};
ObjectWithoutPrototypeCache.prototype.set = function(key, value) {
  this.cache[key] = value;
};
var cacheDefault = {
  create: function create() {
    return new ObjectWithoutPrototypeCache();
  }
};
var strategies = {
  variadic: strategyVariadic,
  monadic: strategyMonadic
};

// ../node_modules/intl-messageformat/lib/src/error.js
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2["MISSING_VALUE"] = "MISSING_VALUE";
  ErrorCode2["INVALID_VALUE"] = "INVALID_VALUE";
  ErrorCode2["MISSING_INTL_API"] = "MISSING_INTL_API";
})(ErrorCode || (ErrorCode = {}));
var FormatError = (
  /** @class */
  function(_super) {
    __extends(FormatError2, _super);
    function FormatError2(msg, code, originalMessage) {
      var _this = _super.call(this, msg) || this;
      _this.code = code;
      _this.originalMessage = originalMessage;
      return _this;
    }
    FormatError2.prototype.toString = function() {
      return "[formatjs Error: ".concat(this.code, "] ").concat(this.message);
    };
    return FormatError2;
  }(Error)
);
var InvalidValueError = (
  /** @class */
  function(_super) {
    __extends(InvalidValueError2, _super);
    function InvalidValueError2(variableId, value, options, originalMessage) {
      return _super.call(this, 'Invalid values for "'.concat(variableId, '": "').concat(value, '". Options are "').concat(Object.keys(options).join('", "'), '"'), ErrorCode.INVALID_VALUE, originalMessage) || this;
    }
    return InvalidValueError2;
  }(FormatError)
);
var InvalidValueTypeError = (
  /** @class */
  function(_super) {
    __extends(InvalidValueTypeError2, _super);
    function InvalidValueTypeError2(value, type, originalMessage) {
      return _super.call(this, 'Value for "'.concat(value, '" must be of type ').concat(type), ErrorCode.INVALID_VALUE, originalMessage) || this;
    }
    return InvalidValueTypeError2;
  }(FormatError)
);
var MissingValueError = (
  /** @class */
  function(_super) {
    __extends(MissingValueError2, _super);
    function MissingValueError2(variableId, originalMessage) {
      return _super.call(this, 'The intl string context variable "'.concat(variableId, '" was not provided to the string "').concat(originalMessage, '"'), ErrorCode.MISSING_VALUE, originalMessage) || this;
    }
    return MissingValueError2;
  }(FormatError)
);

// ../node_modules/intl-messageformat/lib/src/formatters.js
var PART_TYPE;
(function(PART_TYPE2) {
  PART_TYPE2[PART_TYPE2["literal"] = 0] = "literal";
  PART_TYPE2[PART_TYPE2["object"] = 1] = "object";
})(PART_TYPE || (PART_TYPE = {}));
function mergeLiteral(parts) {
  if (parts.length < 2) {
    return parts;
  }
  return parts.reduce(function(all, part) {
    var lastPart = all[all.length - 1];
    if (!lastPart || lastPart.type !== PART_TYPE.literal || part.type !== PART_TYPE.literal) {
      all.push(part);
    } else {
      lastPart.value += part.value;
    }
    return all;
  }, []);
}
function isFormatXMLElementFn(el) {
  return typeof el === "function";
}
function formatToParts(els, locales, formatters, formats, values, currentPluralValue, originalMessage) {
  if (els.length === 1 && isLiteralElement(els[0])) {
    return [
      {
        type: PART_TYPE.literal,
        value: els[0].value
      }
    ];
  }
  var result = [];
  for (var _i = 0, els_1 = els; _i < els_1.length; _i++) {
    var el = els_1[_i];
    if (isLiteralElement(el)) {
      result.push({
        type: PART_TYPE.literal,
        value: el.value
      });
      continue;
    }
    if (isPoundElement(el)) {
      if (typeof currentPluralValue === "number") {
        result.push({
          type: PART_TYPE.literal,
          value: formatters.getNumberFormat(locales).format(currentPluralValue)
        });
      }
      continue;
    }
    var varName = el.value;
    if (!(values && varName in values)) {
      throw new MissingValueError(varName, originalMessage);
    }
    var value = values[varName];
    if (isArgumentElement(el)) {
      if (!value || typeof value === "string" || typeof value === "number") {
        value = typeof value === "string" || typeof value === "number" ? String(value) : "";
      }
      result.push({
        type: typeof value === "string" ? PART_TYPE.literal : PART_TYPE.object,
        value
      });
      continue;
    }
    if (isDateElement(el)) {
      var style = typeof el.style === "string" ? formats.date[el.style] : isDateTimeSkeleton(el.style) ? el.style.parsedOptions : void 0;
      result.push({
        type: PART_TYPE.literal,
        value: formatters.getDateTimeFormat(locales, style).format(value)
      });
      continue;
    }
    if (isTimeElement(el)) {
      var style = typeof el.style === "string" ? formats.time[el.style] : isDateTimeSkeleton(el.style) ? el.style.parsedOptions : formats.time.medium;
      result.push({
        type: PART_TYPE.literal,
        value: formatters.getDateTimeFormat(locales, style).format(value)
      });
      continue;
    }
    if (isNumberElement(el)) {
      var style = typeof el.style === "string" ? formats.number[el.style] : isNumberSkeleton(el.style) ? el.style.parsedOptions : void 0;
      if (style && style.scale) {
        value = value * (style.scale || 1);
      }
      result.push({
        type: PART_TYPE.literal,
        value: formatters.getNumberFormat(locales, style).format(value)
      });
      continue;
    }
    if (isTagElement(el)) {
      var children = el.children, value_1 = el.value;
      var formatFn = values[value_1];
      if (!isFormatXMLElementFn(formatFn)) {
        throw new InvalidValueTypeError(value_1, "function", originalMessage);
      }
      var parts = formatToParts(children, locales, formatters, formats, values, currentPluralValue);
      var chunks = formatFn(parts.map(function(p) {
        return p.value;
      }));
      if (!Array.isArray(chunks)) {
        chunks = [chunks];
      }
      result.push.apply(result, chunks.map(function(c) {
        return {
          type: typeof c === "string" ? PART_TYPE.literal : PART_TYPE.object,
          value: c
        };
      }));
    }
    if (isSelectElement(el)) {
      var opt = el.options[value] || el.options.other;
      if (!opt) {
        throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
      }
      result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values));
      continue;
    }
    if (isPluralElement(el)) {
      var opt = el.options["=".concat(value)];
      if (!opt) {
        if (!Intl.PluralRules) {
          throw new FormatError('Intl.PluralRules is not available in this environment.\nTry polyfilling it using "@formatjs/intl-pluralrules"\n', ErrorCode.MISSING_INTL_API, originalMessage);
        }
        var rule = formatters.getPluralRules(locales, { type: el.pluralType }).select(value - (el.offset || 0));
        opt = el.options[rule] || el.options.other;
      }
      if (!opt) {
        throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
      }
      result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values, value - (el.offset || 0)));
      continue;
    }
  }
  return mergeLiteral(result);
}

// ../node_modules/intl-messageformat/lib/src/core.js
function mergeConfig(c1, c2) {
  if (!c2) {
    return c1;
  }
  return __assign(__assign(__assign({}, c1 || {}), c2 || {}), Object.keys(c1).reduce(function(all, k) {
    all[k] = __assign(__assign({}, c1[k]), c2[k] || {});
    return all;
  }, {}));
}
function mergeConfigs(defaultConfig, configs) {
  if (!configs) {
    return defaultConfig;
  }
  return Object.keys(defaultConfig).reduce(function(all, k) {
    all[k] = mergeConfig(defaultConfig[k], configs[k]);
    return all;
  }, __assign({}, defaultConfig));
}
function createFastMemoizeCache(store) {
  return {
    create: function() {
      return {
        get: function(key) {
          return store[key];
        },
        set: function(key, value) {
          store[key] = value;
        }
      };
    }
  };
}
function createDefaultFormatters(cache) {
  if (cache === void 0) {
    cache = {
      number: {},
      dateTime: {},
      pluralRules: {}
    };
  }
  return {
    getNumberFormat: memoize(function() {
      var _a2;
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return new ((_a2 = Intl.NumberFormat).bind.apply(_a2, __spreadArray([void 0], args, false)))();
    }, {
      cache: createFastMemoizeCache(cache.number),
      strategy: strategies.variadic
    }),
    getDateTimeFormat: memoize(function() {
      var _a2;
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return new ((_a2 = Intl.DateTimeFormat).bind.apply(_a2, __spreadArray([void 0], args, false)))();
    }, {
      cache: createFastMemoizeCache(cache.dateTime),
      strategy: strategies.variadic
    }),
    getPluralRules: memoize(function() {
      var _a2;
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return new ((_a2 = Intl.PluralRules).bind.apply(_a2, __spreadArray([void 0], args, false)))();
    }, {
      cache: createFastMemoizeCache(cache.pluralRules),
      strategy: strategies.variadic
    })
  };
}
var IntlMessageFormat = (
  /** @class */
  function() {
    function IntlMessageFormat2(message, locales, overrideFormats, opts) {
      var _this = this;
      if (locales === void 0) {
        locales = IntlMessageFormat2.defaultLocale;
      }
      this.formatterCache = {
        number: {},
        dateTime: {},
        pluralRules: {}
      };
      this.format = function(values) {
        var parts = _this.formatToParts(values);
        if (parts.length === 1) {
          return parts[0].value;
        }
        var result = parts.reduce(function(all, part) {
          if (!all.length || part.type !== PART_TYPE.literal || typeof all[all.length - 1] !== "string") {
            all.push(part.value);
          } else {
            all[all.length - 1] += part.value;
          }
          return all;
        }, []);
        if (result.length <= 1) {
          return result[0] || "";
        }
        return result;
      };
      this.formatToParts = function(values) {
        return formatToParts(_this.ast, _this.locales, _this.formatters, _this.formats, values, void 0, _this.message);
      };
      this.resolvedOptions = function() {
        return {
          locale: _this.resolvedLocale.toString()
        };
      };
      this.getAst = function() {
        return _this.ast;
      };
      this.locales = locales;
      this.resolvedLocale = IntlMessageFormat2.resolveLocale(locales);
      if (typeof message === "string") {
        this.message = message;
        if (!IntlMessageFormat2.__parse) {
          throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");
        }
        this.ast = IntlMessageFormat2.__parse(message, {
          ignoreTag: opts === null || opts === void 0 ? void 0 : opts.ignoreTag,
          locale: this.resolvedLocale
        });
      } else {
        this.ast = message;
      }
      if (!Array.isArray(this.ast)) {
        throw new TypeError("A message must be provided as a String or AST.");
      }
      this.formats = mergeConfigs(IntlMessageFormat2.formats, overrideFormats);
      this.formatters = opts && opts.formatters || createDefaultFormatters(this.formatterCache);
    }
    Object.defineProperty(IntlMessageFormat2, "defaultLocale", {
      get: function() {
        if (!IntlMessageFormat2.memoizedDefaultLocale) {
          IntlMessageFormat2.memoizedDefaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
        }
        return IntlMessageFormat2.memoizedDefaultLocale;
      },
      enumerable: false,
      configurable: true
    });
    IntlMessageFormat2.memoizedDefaultLocale = null;
    IntlMessageFormat2.resolveLocale = function(locales) {
      var supportedLocales = Intl.NumberFormat.supportedLocalesOf(locales);
      if (supportedLocales.length > 0) {
        return new Intl.Locale(supportedLocales[0]);
      }
      return new Intl.Locale(typeof locales === "string" ? locales : locales[0]);
    };
    IntlMessageFormat2.__parse = parse;
    IntlMessageFormat2.formats = {
      number: {
        integer: {
          maximumFractionDigits: 0
        },
        currency: {
          style: "currency"
        },
        percent: {
          style: "percent"
        }
      },
      date: {
        short: {
          month: "numeric",
          day: "numeric",
          year: "2-digit"
        },
        medium: {
          month: "short",
          day: "numeric",
          year: "numeric"
        },
        long: {
          month: "long",
          day: "numeric",
          year: "numeric"
        },
        full: {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      },
      time: {
        short: {
          hour: "numeric",
          minute: "numeric"
        },
        medium: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        },
        long: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZoneName: "short"
        },
        full: {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZoneName: "short"
        }
      }
    };
    return IntlMessageFormat2;
  }()
);

// ../node_modules/intl-messageformat/lib/index.js
var lib_default = IntlMessageFormat;

// src/price/numberFormat.js
var maskRegex = /[0-9\-+#]/;
var notMaskRegex = /[^\d\-+#]/g;
function getIndex(mask) {
  return mask.search(maskRegex);
}
function processMask(mask = "#.##") {
  const maskObj = {};
  const len = mask.length;
  const start = getIndex(mask);
  maskObj.prefix = start > 0 ? mask.substring(0, start) : "";
  const end = getIndex(mask.split("").reverse().join(""));
  const offset = len - end;
  const substr = mask.substring(offset, offset + 1);
  const indx = offset + (substr === "." || substr === "," ? 1 : 0);
  maskObj.suffix = end > 0 ? mask.substring(indx, len) : "";
  maskObj.mask = mask.substring(start, indx);
  maskObj.maskHasNegativeSign = maskObj.mask.charAt(0) === "-";
  maskObj.maskHasPositiveSign = maskObj.mask.charAt(0) === "+";
  let result = maskObj.mask.match(notMaskRegex);
  maskObj.decimal = result && result[result.length - 1] || ".";
  maskObj.separator = result && result[1] && result[0] || ",";
  result = maskObj.mask.split(maskObj.decimal);
  maskObj.integer = result[0];
  maskObj.fraction = result[1];
  return maskObj;
}
function processValue(value, maskObj, options) {
  let isNegative = false;
  const valObj = {
    value
  };
  if (value < 0) {
    isNegative = true;
    valObj.value = -valObj.value;
  }
  valObj.sign = isNegative ? "-" : "";
  valObj.value = Number(valObj.value).toFixed(
    maskObj.fraction && maskObj.fraction.length
  );
  valObj.value = Number(valObj.value).toString();
  const posTrailZero = maskObj.fraction && maskObj.fraction.lastIndexOf("0");
  let [valInteger = "0", valFraction = ""] = valObj.value.split(".");
  if (!valFraction || valFraction && valFraction.length <= posTrailZero) {
    valFraction = posTrailZero < 0 ? "" : Number("0." + valFraction).toFixed(posTrailZero + 1).replace("0.", "");
  }
  valObj.integer = valInteger;
  valObj.fraction = valFraction;
  addSeparators(valObj, maskObj);
  if (valObj.result === "0" || valObj.result === "") {
    isNegative = false;
    valObj.sign = "";
  }
  if (!isNegative && maskObj.maskHasPositiveSign) {
    valObj.sign = "+";
  } else if (isNegative && maskObj.maskHasPositiveSign) {
    valObj.sign = "-";
  } else if (isNegative) {
    valObj.sign = options && options.enforceMaskSign && !maskObj.maskHasNegativeSign ? "" : "-";
  }
  return valObj;
}
function addSeparators(valObj, maskObj) {
  valObj.result = "";
  const szSep = maskObj.integer.split(maskObj.separator);
  const maskInteger = szSep.join("");
  const posLeadZero = maskInteger && maskInteger.indexOf("0");
  if (posLeadZero > -1) {
    while (valObj.integer.length < maskInteger.length - posLeadZero) {
      valObj.integer = "0" + valObj.integer;
    }
  } else if (Number(valObj.integer) === 0) {
    valObj.integer = "";
  }
  const posSeparator = szSep[1] && szSep[szSep.length - 1].length;
  if (posSeparator) {
    const len = valObj.integer.length;
    const offset = len % posSeparator;
    for (let indx = 0; indx < len; indx++) {
      valObj.result += valObj.integer.charAt(indx);
      if (!((indx - offset + 1) % posSeparator) && indx < len - posSeparator) {
        valObj.result += maskObj.separator;
      }
    }
  } else {
    valObj.result = valObj.integer;
  }
  valObj.result += maskObj.fraction && valObj.fraction ? maskObj.decimal + valObj.fraction : "";
  return valObj;
}
function formatNumber(mask, value, options = {}) {
  if (!mask || isNaN(Number(value))) {
    return value;
  }
  const maskObj = processMask(mask);
  const valObj = processValue(value, maskObj, options);
  return maskObj.prefix + valObj.sign + valObj.result + maskObj.suffix;
}
var numberFormat_default = formatNumber;

// src/price/utilities.js
var DECIMAL_POINT = ".";
var DECIMAL_COMMA = ",";
var SPACE_START_PATTERN = /^\s+/;
var SPACE_END_PATTERN = /\s+$/;
var NBSP = "&nbsp;";
var getAnnualPrice = (price2) => price2 * 12;
var isPromotionActive = (promotion, instant) => {
  const {
    start,
    end,
    displaySummary: {
      amount,
      duration,
      minProductQuantity,
      outcomeType
    } = {}
  } = promotion;
  if (!(amount && duration && outcomeType && minProductQuantity)) {
    return false;
  }
  const now = instant ? new Date(instant) : /* @__PURE__ */ new Date();
  if (!start || !end) {
    return false;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
};
var RecurrenceTerm = {
  MONTH: "MONTH",
  YEAR: "YEAR"
};
var opticalPriceDivisors = {
  [Term.ANNUAL]: 12,
  [Term.MONTHLY]: 1,
  [Term.THREE_YEARS]: 36,
  [Term.TWO_YEARS]: 24
};
var opticalPriceRoundingRule = (accept, round) => ({ accept, round });
var opticalPriceRoundingRules = [
  opticalPriceRoundingRule(
    // optical price for the term is a multiple of the initial price
    ({ divisor, price: price2 }) => price2 % divisor == 0,
    ({ divisor, price: price2 }) => price2 / divisor
  ),
  opticalPriceRoundingRule(
    // round optical price up to 2 decimals
    ({ usePrecision }) => usePrecision,
    ({ divisor, price: price2 }) => Math.round(price2 / divisor * 100) / 100
  ),
  opticalPriceRoundingRule(
    // round optical price up to integer
    () => true,
    ({ divisor, price: price2 }) => Math.ceil(Math.floor(price2 * 100 / divisor) / 100)
  )
];
var recurrenceTerms = {
  [Commitment.YEAR]: {
    [Term.MONTHLY]: RecurrenceTerm.MONTH,
    [Term.ANNUAL]: RecurrenceTerm.YEAR
  },
  [Commitment.MONTH]: {
    [Term.MONTHLY]: RecurrenceTerm.MONTH
  }
};
var currencyIsFirstChar = (formatString, currencySymbol) => formatString.indexOf(`'${currencySymbol}'`) === 0;
var extractNumberMask = (formatString, usePrecision = true) => {
  let numberMask = formatString.replace(/'.*?'/, "").trim();
  const decimalsDelimiter = findDecimalsDelimiter(numberMask);
  const hasDecimalDelimiter = !!decimalsDelimiter;
  if (!hasDecimalDelimiter) {
    numberMask = numberMask.replace(
      /\s?(#.*0)(?!\s)?/,
      "$&" + getPossibleDecimalsDelimiter(formatString)
    );
  } else if (!usePrecision) {
    numberMask = numberMask.replace(/[,\.]0+/, decimalsDelimiter);
  }
  return numberMask;
};
var getCurrencySymbolDetails = (formatString) => {
  const currencySymbol = findCurrencySymbol(formatString);
  const isCurrencyFirst = currencyIsFirstChar(formatString, currencySymbol);
  const formatStringWithoutSymbol = formatString.replace(/'.*?'/, "");
  const hasCurrencySpace = SPACE_START_PATTERN.test(formatStringWithoutSymbol) || SPACE_END_PATTERN.test(formatStringWithoutSymbol);
  return { currencySymbol, isCurrencyFirst, hasCurrencySpace };
};
var makeSpacesAroundNonBreaking = (text) => {
  return text.replace(SPACE_START_PATTERN, NBSP).replace(SPACE_END_PATTERN, NBSP);
};
var getPossibleDecimalsDelimiter = (formatString) => formatString.match(/#(.?)#/)?.[1] === DECIMAL_POINT ? DECIMAL_COMMA : DECIMAL_POINT;
var findCurrencySymbol = (formatString) => formatString.match(/'(.*?)'/)?.[1] ?? "";
var findDecimalsDelimiter = (formatString) => formatString.match(/0(.?)0/)?.[1] ?? "";
function formatPrice({ formatString, price: price2, usePrecision, isIndianPrice = false }, recurrenceTerm, transformPrice = (formattedPrice) => formattedPrice) {
  const { currencySymbol, isCurrencyFirst, hasCurrencySpace } = getCurrencySymbolDetails(formatString);
  const decimalsDelimiter = usePrecision ? findDecimalsDelimiter(formatString) : "";
  const numberMask = extractNumberMask(formatString, usePrecision);
  const fractionDigits = usePrecision ? 2 : 0;
  const transformedPrice = transformPrice(price2, { currencySymbol });
  const formattedPrice = isIndianPrice ? transformedPrice.toLocaleString("hi-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }) : numberFormat_default(numberMask, transformedPrice);
  const decimalIndex = usePrecision ? formattedPrice.lastIndexOf(decimalsDelimiter) : formattedPrice.length;
  const integer = formattedPrice.substring(0, decimalIndex);
  const decimals = formattedPrice.substring(decimalIndex + 1);
  const accessiblePrice = formatString.replace(/'.*?'/, "SYMBOL").replace(/#.*0/, formattedPrice).replace(/SYMBOL/, currencySymbol);
  return {
    accessiblePrice,
    currencySymbol,
    decimals,
    decimalsDelimiter,
    hasCurrencySpace,
    integer,
    isCurrencyFirst,
    recurrenceTerm
  };
}
var formatOpticalPrice = (data) => {
  const { commitment, term, usePrecision } = data;
  const divisor = opticalPriceDivisors[term] ?? 1;
  return formatPrice(
    data,
    divisor > 1 ? RecurrenceTerm.MONTH : recurrenceTerms[commitment]?.[term],
    (price2) => {
      const priceData = {
        divisor,
        price: price2,
        usePrecision
      };
      const { round } = opticalPriceRoundingRules.find(
        ({ accept }) => accept(priceData)
      );
      if (!round)
        throw new Error(
          `Missing rounding rule for: ${JSON.stringify(priceData)}`
        );
      return round(priceData);
    }
  );
};
var formatRegularPrice = ({ commitment, term, ...data }) => formatPrice(data, recurrenceTerms[commitment]?.[term]);
var formatAnnualPrice = (data) => {
  const {
    commitment,
    instant,
    price: price2,
    originalPrice,
    priceWithoutDiscount,
    promotion,
    quantity = 1,
    term
  } = data;
  if (commitment === Commitment.YEAR && term === Term.MONTHLY) {
    if (!promotion) {
      return formatPrice(data, RecurrenceTerm.YEAR, getAnnualPrice);
    }
    const {
      displaySummary: {
        outcomeType,
        duration,
        minProductQuantity = 1
      } = {}
    } = promotion;
    switch (outcomeType) {
      case "PERCENTAGE_DISCOUNT": {
        if (quantity >= minProductQuantity && isPromotionActive(promotion, instant)) {
          const durationInMonths = parseInt(
            duration.replace("P", "").replace("M", "")
          );
          if (isNaN(durationInMonths)) return getAnnualPrice(price2);
          const discountPrice = quantity * originalPrice * durationInMonths;
          const regularPrice = quantity * priceWithoutDiscount * (12 - durationInMonths);
          const totalPrice = Math.round((discountPrice + regularPrice) * 100) / 100;
          return formatPrice(
            { ...data, price: totalPrice },
            RecurrenceTerm.YEAR
          );
        }
      }
      default:
        return formatPrice(
          data,
          RecurrenceTerm.YEAR,
          () => getAnnualPrice(priceWithoutDiscount ?? price2)
        );
    }
  }
  return formatPrice(data, recurrenceTerms[commitment]?.[term]);
};

// src/price/template.js
var defaultLiterals = {
  recurrenceLabel: "{recurrenceTerm, select, MONTH {/mo} YEAR {/yr} other {}}",
  recurrenceAriaLabel: "{recurrenceTerm, select, MONTH {per month} YEAR {per year} other {}}",
  perUnitLabel: "{perUnit, select, LICENSE {per license} other {}}",
  perUnitAriaLabel: "{perUnit, select, LICENSE {per license} other {}}",
  freeLabel: "Free",
  freeAriaLabel: "Free",
  taxExclusiveLabel: "{taxTerm, select, GST {excl. GST} VAT {excl. VAT} TAX {excl. tax} IVA {excl. IVA} SST {excl. SST} KDV {excl. KDV} other {}}",
  taxInclusiveLabel: "{taxTerm, select, GST {incl. GST} VAT {incl. VAT} TAX {incl. tax} IVA {incl. IVA} SST {incl. SST} KDV {incl. KDV} other {}}",
  alternativePriceAriaLabel: "Alternatively at",
  strikethroughAriaLabel: "Regularly at",
  planTypeLabel: "{planType, select, ABM {Annual, billed monthly} other {}}"
};
var log = createLog("ConsonantTemplates/price");
var htmlPattern = /<\/?[^>]+(>|$)/g;
var cssClassNames = {
  container: "price",
  containerOptical: "price-optical",
  containerStrikethrough: "price-strikethrough",
  containerAlternative: "price-alternative",
  containerAnnual: "price-annual",
  containerAnnualPrefix: "price-annual-prefix",
  containerAnnualSuffix: "price-annual-suffix",
  disabled: "disabled",
  currencySpace: "price-currency-space",
  currencySymbol: "price-currency-symbol",
  decimals: "price-decimals",
  decimalsDelimiter: "price-decimals-delimiter",
  integer: "price-integer",
  recurrence: "price-recurrence",
  taxInclusivity: "price-tax-inclusivity",
  unitType: "price-unit-type"
};
var literalKeys = {
  perUnitLabel: "perUnitLabel",
  perUnitAriaLabel: "perUnitAriaLabel",
  recurrenceLabel: "recurrenceLabel",
  recurrenceAriaLabel: "recurrenceAriaLabel",
  taxExclusiveLabel: "taxExclusiveLabel",
  taxInclusiveLabel: "taxInclusiveLabel",
  strikethroughAriaLabel: "strikethroughAriaLabel",
  alternativePriceAriaLabel: "alternativePriceAriaLabel"
};
var WCS_TAX_DISPLAY_EXCLUSIVE = "TAX_EXCLUSIVE";
var renderAttributes = (attributes) => isObject(attributes) ? Object.entries(attributes).filter(
  ([, value]) => isString(value) || isNumber(value) || value === true
).reduce(
  (html13, [key, value]) => html13 + ` ${key}${value === true ? "" : '="' + escapeHtml(value) + '"'}`,
  ""
) : "";
var renderSpan = (cssClass, content, attributes, convertSpaces = false) => {
  return `<span class="${cssClass}${content ? "" : " " + cssClassNames.disabled}"${renderAttributes(attributes)}>${convertSpaces ? makeSpacesAroundNonBreaking(content) : content ?? ""}</span>`;
};
function formatLiteral(literals, locale, key, parameters) {
  const literal = literals[key];
  if (literal == void 0) {
    return "";
  }
  try {
    return new lib_default(
      literal.replace(htmlPattern, ""),
      locale
    ).format(parameters);
  } catch {
    log.error("Failed to format literal:", literal);
    return "";
  }
}
function renderContainer(cssClass, {
  accessibleLabel,
  altAccessibleLabel,
  currencySymbol,
  decimals,
  decimalsDelimiter,
  hasCurrencySpace,
  integer,
  isCurrencyFirst,
  recurrenceLabel,
  perUnitLabel,
  taxInclusivityLabel
}, attributes = {}) {
  const currencyMarkup = renderSpan(
    cssClassNames.currencySymbol,
    currencySymbol
  );
  const currencySpaceMarkup = renderSpan(
    cssClassNames.currencySpace,
    hasCurrencySpace ? "&nbsp;" : ""
  );
  let markup = "";
  if (accessibleLabel)
    markup = `<sr-only class="strikethrough-aria-label">${accessibleLabel}</sr-only>`;
  else if (altAccessibleLabel)
    markup = `<sr-only class="alt-aria-label">${altAccessibleLabel}</sr-only>`;
  if (isCurrencyFirst) markup += currencyMarkup + currencySpaceMarkup;
  markup += renderSpan(cssClassNames.integer, integer);
  markup += renderSpan(cssClassNames.decimalsDelimiter, decimalsDelimiter);
  markup += renderSpan(cssClassNames.decimals, decimals);
  if (!isCurrencyFirst) markup += currencySpaceMarkup + currencyMarkup;
  markup += renderSpan(cssClassNames.recurrence, recurrenceLabel, null, true);
  markup += renderSpan(cssClassNames.unitType, perUnitLabel, null, true);
  markup += renderSpan(
    cssClassNames.taxInclusivity,
    taxInclusivityLabel,
    true
  );
  return renderSpan(cssClass, markup, {
    ...attributes
  });
}
var createPriceTemplate = ({
  isAlternativePrice = false,
  displayOptical = false,
  displayStrikethrough = false,
  displayAnnual = false,
  instant = void 0
} = {}) => ({
  country,
  displayFormatted = true,
  displayRecurrence = true,
  displayPerUnit = false,
  displayTax = false,
  language,
  literals: priceLiterals2 = {},
  quantity = 1,
  space = false
  // add a space between price literals
} = {}, {
  commitment,
  offerSelectorIds,
  formatString,
  price: price2,
  priceWithoutDiscount,
  taxDisplay,
  taxTerm,
  term,
  usePrecision,
  promotion
} = {}, attributes = {}) => {
  Object.entries({
    country,
    formatString,
    language,
    price: price2
  }).forEach(([key, value]) => {
    if (value == null) {
      throw new Error(
        `Argument "${key}" is missing for osi ${offerSelectorIds?.toString()}, country ${country}, language ${language}`
      );
    }
  });
  const literals = {
    ...defaultLiterals,
    ...priceLiterals2
  };
  const locale = `${language.toLowerCase()}-${country.toUpperCase()}`;
  const displayPrice = displayStrikethrough && priceWithoutDiscount ? priceWithoutDiscount : price2;
  let method = displayOptical ? formatOpticalPrice : formatRegularPrice;
  if (displayAnnual) {
    method = formatAnnualPrice;
  }
  const { accessiblePrice, recurrenceTerm, ...formattedPrice } = method({
    commitment,
    formatString,
    instant,
    isIndianPrice: country === "IN",
    originalPrice: price2,
    priceWithoutDiscount,
    price: displayOptical ? price2 : displayPrice,
    promotion,
    quantity,
    term,
    usePrecision
  });
  let accessibleLabel = "", altAccessibleLabel = "";
  let recurrenceLabel = "";
  if (toBoolean(displayRecurrence) && recurrenceTerm) {
    recurrenceLabel = formatLiteral(
      literals,
      locale,
      literalKeys.recurrenceLabel,
      {
        recurrenceTerm
      }
    );
  }
  let perUnitLabel = "";
  if (toBoolean(displayPerUnit)) {
    if (space) {
      perUnitLabel += " ";
    }
    perUnitLabel += formatLiteral(
      literals,
      locale,
      literalKeys.perUnitLabel,
      {
        perUnit: "LICENSE"
      }
    );
  }
  let taxInclusivityLabel = "";
  if (toBoolean(displayTax) && taxTerm) {
    if (space) {
      taxInclusivityLabel += " ";
    }
    taxInclusivityLabel += formatLiteral(
      literals,
      locale,
      taxDisplay === WCS_TAX_DISPLAY_EXCLUSIVE ? literalKeys.taxExclusiveLabel : literalKeys.taxInclusiveLabel,
      { taxTerm }
    );
  }
  if (displayStrikethrough) {
    accessibleLabel = formatLiteral(
      literals,
      locale,
      literalKeys.strikethroughAriaLabel,
      {
        strikethroughPrice: accessibleLabel
      }
    );
  }
  if (isAlternativePrice) {
    altAccessibleLabel = formatLiteral(
      literals,
      locale,
      literalKeys.alternativePriceAriaLabel,
      {
        alternativePrice: altAccessibleLabel
      }
    );
  }
  let cssClass = cssClassNames.container;
  if (displayOptical) {
    cssClass += " " + cssClassNames.containerOptical;
  }
  if (displayStrikethrough) {
    cssClass += " " + cssClassNames.containerStrikethrough;
  }
  if (isAlternativePrice) {
    cssClass += " " + cssClassNames.containerAlternative;
  }
  if (displayAnnual) {
    cssClass += " " + cssClassNames.containerAnnual;
  }
  if (toBoolean(displayFormatted)) {
    return renderContainer(
      cssClass,
      {
        ...formattedPrice,
        accessibleLabel,
        altAccessibleLabel,
        recurrenceLabel,
        perUnitLabel,
        taxInclusivityLabel
      },
      attributes
    );
  }
  const {
    currencySymbol,
    decimals,
    decimalsDelimiter,
    hasCurrencySpace,
    integer,
    isCurrencyFirst
  } = formattedPrice;
  const unformattedPrice = [integer, decimalsDelimiter, decimals];
  if (isCurrencyFirst) {
    unformattedPrice.unshift(hasCurrencySpace ? "\xA0" : "");
    unformattedPrice.unshift(currencySymbol);
  } else {
    unformattedPrice.push(hasCurrencySpace ? "\xA0" : "");
    unformattedPrice.push(currencySymbol);
  }
  unformattedPrice.push(
    recurrenceLabel,
    perUnitLabel,
    taxInclusivityLabel
  );
  const content = unformattedPrice.join("");
  return renderSpan(cssClass, content, attributes);
};
var createPromoPriceTemplate = () => (context, value, attributes) => {
  const displayOldPrice = context.displayOldPrice === void 0 || toBoolean(context.displayOldPrice);
  const shouldDisplayOldPrice = displayOldPrice && value.priceWithoutDiscount && value.priceWithoutDiscount != value.price;
  return `${shouldDisplayOldPrice ? createPriceTemplate({
    displayStrikethrough: true
  })(context, value, attributes) + "&nbsp;" : ""}${createPriceTemplate({ isAlternativePrice: shouldDisplayOldPrice })(context, value, attributes)}`;
};
var createPromoPriceWithAnnualTemplate = () => (context, value, attributes) => {
  let { instant } = context;
  try {
    if (!instant) {
      instant = new URLSearchParams(document.location.search).get(
        "instant"
      );
    }
    if (instant) {
      instant = new Date(instant);
    }
  } catch (e) {
    instant = void 0;
  }
  const ctxStAnnual = {
    ...context,
    displayTax: false,
    displayPerUnit: false
  };
  const displayOldPrice = context.displayOldPrice === void 0 || toBoolean(context.displayOldPrice);
  const shouldDisplayOldPrice = displayOldPrice && value.priceWithoutDiscount && value.priceWithoutDiscount != value.price;
  return `${shouldDisplayOldPrice ? createPriceTemplate({
    displayStrikethrough: true
  })(ctxStAnnual, value, attributes) + "&nbsp;" : ""}${createPriceTemplate({ isAlternativePrice: shouldDisplayOldPrice })(context, value, attributes)}${renderSpan(cssClassNames.containerAnnualPrefix, "&nbsp;(")}${createPriceTemplate(
    {
      displayAnnual: true,
      instant
    }
  )(
    ctxStAnnual,
    value,
    attributes
  )}${renderSpan(cssClassNames.containerAnnualSuffix, ")")}`;
};
var createPriceWithAnnualTemplate = () => (context, value, attributes) => {
  const ctxAnnual = {
    ...context,
    displayTax: false,
    displayPerUnit: false
  };
  return `${createPriceTemplate({ isAlternativePrice: context.displayOldPrice })(context, value, attributes)}${renderSpan(cssClassNames.containerAnnualPrefix, "&nbsp;(")}${createPriceTemplate(
    {
      displayAnnual: true
    }
  )(
    ctxAnnual,
    value,
    attributes
  )}${renderSpan(cssClassNames.containerAnnualSuffix, ")")}`;
};

// src/price/legal.js
var cssClassNames2 = {
  ...cssClassNames,
  containerLegal: "price-legal",
  planType: "price-plan-type"
};
var literalKeys2 = {
  ...literalKeys,
  planTypeLabel: "planTypeLabel"
};
function renderContainer2(cssClass, { perUnitLabel, taxInclusivityLabel, planTypeLabel }, attributes = {}) {
  let markup = "";
  markup += renderSpan(cssClassNames2.unitType, perUnitLabel, null, true);
  if (taxInclusivityLabel && planTypeLabel) {
    taxInclusivityLabel += ". ";
  }
  markup += renderSpan(
    cssClassNames2.taxInclusivity,
    taxInclusivityLabel,
    true
  );
  markup += renderSpan(cssClassNames2.planType, planTypeLabel, null);
  return renderSpan(cssClass, markup, {
    ...attributes
  });
}
var legalTemplate = ({
  country,
  displayPerUnit = false,
  displayTax = false,
  displayPlanType = false,
  language,
  literals: priceLiterals2 = {}
} = {}, { taxDisplay, taxTerm, planType } = {}, attributes = {}) => {
  const literals = {
    ...defaultLiterals,
    ...priceLiterals2
  };
  const locale = `${language.toLowerCase()}-${country.toUpperCase()}`;
  let perUnitLabel = "";
  if (toBoolean(displayPerUnit)) {
    perUnitLabel = formatLiteral(
      literals,
      locale,
      literalKeys2.perUnitLabel,
      {
        perUnit: "LICENSE"
      }
    );
  }
  let taxInclusivityLabel = "";
  if (country === "US" && language === "en") {
    displayTax = false;
  }
  if (toBoolean(displayTax) && taxTerm) {
    taxInclusivityLabel = formatLiteral(
      literals,
      locale,
      taxDisplay === WCS_TAX_DISPLAY_EXCLUSIVE ? literalKeys2.taxExclusiveLabel : literalKeys2.taxInclusiveLabel,
      { taxTerm }
    );
  }
  let planTypeLabel = "";
  if (toBoolean(displayPlanType) && planType) {
    planTypeLabel = formatLiteral(
      literals,
      locale,
      literalKeys2.planTypeLabel,
      {
        planType
      }
    );
  }
  let cssClass = cssClassNames2.container;
  cssClass += " " + cssClassNames2.containerLegal;
  return renderContainer2(
    cssClass,
    {
      perUnitLabel,
      taxInclusivityLabel,
      planTypeLabel
    },
    attributes
  );
};

// src/price/index.js
var price = createPriceTemplate();
var pricePromo = createPromoPriceTemplate();
var priceOptical = createPriceTemplate({
  displayOptical: true
});
var priceStrikethrough = createPriceTemplate({
  displayStrikethrough: true
});
var priceAnnual = createPriceTemplate({
  displayAnnual: true
});
var priceOpticalAlternative = createPriceTemplate({
  displayOptical: true,
  isAlternativePrice: true
});
var priceAlternative = createPriceTemplate({
  isAlternativePrice: true
});
var priceWithAnnual = createPriceWithAnnualTemplate();
var pricePromoWithAnnual = createPromoPriceWithAnnualTemplate();
var legal = legalTemplate;

// src/discount/template.js
var getDiscount = (price2, priceWithoutDiscount) => {
  if (!isPositiveFiniteNumber(price2) || !isPositiveFiniteNumber(priceWithoutDiscount))
    return;
  return Math.floor(
    (priceWithoutDiscount - price2) / priceWithoutDiscount * 100
  );
};
var createDiscountTemplate = () => (context, value) => {
  const { price: price2, priceWithoutDiscount } = value;
  const discount2 = getDiscount(price2, priceWithoutDiscount);
  return discount2 === void 0 ? `<span class="no-discount"></span>` : `<span class="discount">${discount2}%</span>`;
};

// src/discount/index.js
var discount = createDiscountTemplate();

// src/inline-price.js
var INDIVIDUAL = "INDIVIDUAL_COM";
var BUSINESS = "TEAM_COM";
var STUDENT = "INDIVIDUAL_EDU";
var UNIVERSITY = "TEAM_EDU";
var DISPLAY_ALL_TAX_COUNTRIES = [
  "GB_en",
  "AU_en",
  "FR_fr",
  "AT_de",
  "BE_en",
  "BE_fr",
  "BE_nl",
  "BG_bg",
  "CH_de",
  "CH_fr",
  "CH_it",
  "CZ_cs",
  "DE_de",
  "DK_da",
  "EE_et",
  "EG_ar",
  "EG_en",
  "ES_es",
  "FI_fi",
  "GR_el",
  "GR_en",
  "HU_hu",
  "IE_en",
  "IT_it",
  "LU_de",
  "LU_en",
  "LU_fr",
  "NL_nl",
  "NO_nb",
  "PL_pl",
  "PT_pt",
  "RO_ro",
  "SE_sv",
  "SI_sl",
  "SK_sk",
  "TR_tr",
  "UA_uk",
  "ID_en",
  "ID_in",
  "IN_en",
  "IN_hi",
  "JP_ja",
  "MY_en",
  "MY_ms",
  "NZ_en",
  "TH_en",
  "TH_th"
];
var DISPLAY_TAX_MAP = {
  [INDIVIDUAL]: [
    "MU_en",
    "LT_lt",
    "LV_lv",
    "NG_en",
    "SA_ar",
    "SA_en",
    "SG_en",
    "KR_ko"
  ],
  [BUSINESS]: ["MU_en", "LT_lt", "LV_lv", "NG_en", "CO_es", "KR_ko"],
  [STUDENT]: ["LT_lt", "LV_lv", "SA_en", "SG_en"],
  [UNIVERSITY]: ["SG_en", "KR_ko"]
};
var TAX_EXCLUDED_MAP = {
  ["MU_en"]: [false, false, false, false],
  ["NG_en"]: [false, false, false, false],
  ["AU_en"]: [false, false, false, false],
  ["JP_ja"]: [false, false, false, false],
  ["NZ_en"]: [false, false, false, false],
  ["TH_en"]: [false, false, false, false],
  ["TH_th"]: [false, false, false, false],
  ["CO_es"]: [false, true, false, false],
  ["AT_de"]: [false, false, false, true],
  ["SG_en"]: [false, false, false, true]
};
var TAX_EXCLUDED_MAP_INDEX = [INDIVIDUAL, BUSINESS, STUDENT, UNIVERSITY];
var defaultTaxExcluded = (segment) => [BUSINESS, UNIVERSITY].includes(segment);
var resolveTaxExclusive = (country, language, customerSegment, marketSegment) => {
  const locale = `${country}_${language}`;
  const segment = `${customerSegment}_${marketSegment}`;
  const val = TAX_EXCLUDED_MAP[locale];
  if (val) {
    const index = TAX_EXCLUDED_MAP_INDEX.indexOf(segment);
    return val[index];
  }
  return defaultTaxExcluded(segment);
};
var resolveDisplayTaxForGeoAndSegment = (country, language, customerSegment, marketSegment) => {
  const locale = `${country}_${language}`;
  if (DISPLAY_ALL_TAX_COUNTRIES.includes(country) || DISPLAY_ALL_TAX_COUNTRIES.includes(locale)) {
    return true;
  }
  const segmentConfig = DISPLAY_TAX_MAP[`${customerSegment}_${marketSegment}`];
  if (!segmentConfig) {
    return Defaults.displayTax;
  }
  if (segmentConfig.includes(country) || segmentConfig.includes(locale)) {
    return true;
  }
  return Defaults.displayTax;
};
var resolvePriceTaxFlags = async (country, language, customerSegment, marketSegment) => {
  const displayTax = resolveDisplayTaxForGeoAndSegment(
    country,
    language,
    customerSegment,
    marketSegment
  );
  return {
    displayTax,
    forceTaxExclusive: displayTax ? resolveTaxExclusive(
      country,
      language,
      customerSegment,
      marketSegment
    ) : Defaults.forceTaxExclusive
  };
};
var _InlinePrice = class _InlinePrice extends HTMLSpanElement {
  constructor() {
    super();
    __publicField(this, "masElement", new MasElement(this));
    this.handleClick = this.handleClick.bind(this);
  }
  static get observedAttributes() {
    return [
      "data-display-old-price",
      "data-display-per-unit",
      "data-display-recurrence",
      "data-display-tax",
      "data-display-plan-type",
      "data-display-annual",
      "data-perpetual",
      "data-promotion-code",
      "data-force-tax-exclusive",
      "data-template",
      "data-wcs-osi"
    ];
  }
  static createInlinePrice(options) {
    const service = getService2();
    if (!service) return null;
    const {
      displayOldPrice,
      displayPerUnit,
      displayRecurrence,
      displayTax,
      displayPlanType,
      displayAnnual,
      forceTaxExclusive,
      perpetual,
      promotionCode,
      quantity,
      alternativePrice,
      template,
      wcsOsi
    } = service.collectPriceOptions(options);
    const element = createMasElement(_InlinePrice, {
      displayOldPrice,
      displayPerUnit,
      displayRecurrence,
      displayTax,
      displayPlanType,
      displayAnnual,
      forceTaxExclusive,
      perpetual,
      promotionCode,
      quantity,
      alternativePrice,
      template,
      wcsOsi
    });
    return element;
  }
  get isInlinePrice() {
    return true;
  }
  attributeChangedCallback(name, _, value) {
    this.masElement.attributeChangedCallback(name, _, value);
  }
  connectedCallback() {
    this.masElement.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }
  disconnectedCallback() {
    this.masElement.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
  }
  handleClick(event) {
    if (event.target === this) return;
    event.stopImmediatePropagation();
    this.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  }
  onceSettled() {
    return this.masElement.onceSettled();
  }
  get value() {
    return this.masElement.value;
  }
  get options() {
    return this.masElement.options;
  }
  get isFailed() {
    return this.masElement.state === STATE_FAILED;
  }
  requestUpdate(force = false) {
    return this.masElement.requestUpdate(force);
  }
  /**
   * Resolves associated osi via Wcs and renders price offer.
   * @param {Record<string, any>} overrides
   */
  async render(overrides = {}) {
    if (!this.isConnected) return false;
    const service = getService2();
    if (!service) return false;
    const priceOptions = service.collectPriceOptions(overrides, this);
    const options = {
      ...service.settings,
      ...priceOptions
    };
    if (!options.wcsOsi.length) return false;
    try {
      const version = this.masElement.togglePending({});
      this.innerHTML = "";
      const [offerSelectors] = await service.resolveOfferSelectors(options);
      let offers = selectOffers(await offerSelectors, options);
      let [offer] = offers;
      if (service.featureFlags[FF_DEFAULTS]) {
        if (priceOptions.displayPerUnit === void 0) {
          options.displayPerUnit = offer.customerSegment !== "INDIVIDUAL";
        }
        if (priceOptions.displayTax === void 0 || priceOptions.forceTaxExclusive === void 0) {
          const { country, language } = options;
          const [marketSegment = ""] = offer.marketSegments;
          const flags = await resolvePriceTaxFlags(
            country,
            language,
            offer.customerSegment,
            marketSegment
          );
          if (priceOptions.displayTax === void 0) {
            options.displayTax = flags?.displayTax || options.displayTax;
          }
          if (priceOptions.forceTaxExclusive === void 0) {
            options.forceTaxExclusive = flags?.forceTaxExclusive || options.forceTaxExclusive;
          }
          if (options.forceTaxExclusive) {
            offers = selectOffers(offers, options);
          }
        }
      } else {
        if (priceOptions.displayOldPrice === void 0) {
          options.displayOldPrice = true;
        }
      }
      return this.renderOffers(offers, options, version);
    } catch (error) {
      this.innerHTML = "";
      throw error;
    }
  }
  // TODO: can be extended to accept array of offers and compute subtotal price
  /**
   * Renders price offer as HTML of this component
   * using consonant price template functions
   * @param {Offer[]} offers
   * @param {Record<string, any>} options
   * @param {number} version
   */
  renderOffers(offers, options, version = void 0) {
    if (!this.isConnected) return;
    const service = getService2();
    if (!service) return false;
    version ?? (version = this.masElement.togglePending());
    if (offers.length) {
      if (this.masElement.toggleResolved(version, offers, options)) {
        this.innerHTML = service.buildPriceHTML(offers, this.options);
        const parentEl = this.closest("p, h3, div");
        if (!parentEl || !parentEl.querySelector(
          'span[data-template="strikethrough"]'
        ) || parentEl.querySelector(".alt-aria-label"))
          return true;
        const inlinePrices = parentEl?.querySelectorAll(
          'span[is="inline-price"]'
        );
        if (inlinePrices.length > 1 && inlinePrices.length === parentEl.querySelectorAll(
          'span[data-template="strikethrough"]'
        ).length * 2) {
          inlinePrices.forEach((price2) => {
            if (price2.dataset.template !== "strikethrough" && price2.options && !price2.options.alternativePrice && !price2.isFailed) {
              price2.options.alternativePrice = true;
              price2.innerHTML = service.buildPriceHTML(
                offers,
                price2.options
              );
            }
          });
        }
        return true;
      }
    } else {
      const error = new Error(
        `Not provided: ${this.options?.wcsOsi ?? "-"}`
      );
      if (this.masElement.toggleFailed(version, error, this.options)) {
        this.innerHTML = "";
        return true;
      }
    }
    return false;
  }
};
__publicField(_InlinePrice, "is", "inline-price");
__publicField(_InlinePrice, "tag", "span");
var InlinePrice = _InlinePrice;
if (!window.customElements.get(InlinePrice.is)) {
  window.customElements.define(InlinePrice.is, InlinePrice, {
    extends: InlinePrice.tag
  });
}

// src/price.js
function Price({ literals, providers, settings }) {
  function collectPriceOptions(overrides, placeholder = null) {
    let options = {
      country: settings.country,
      language: settings.language,
      locale: settings.locale,
      literals: { ...literals.price }
    };
    if (placeholder && providers?.price) {
      for (const provider of providers.price) {
        provider(placeholder, options);
      }
    }
    const {
      displayOldPrice,
      displayPerUnit,
      displayRecurrence,
      displayTax,
      displayPlanType,
      forceTaxExclusive,
      perpetual,
      displayAnnual,
      promotionCode,
      quantity,
      alternativePrice,
      wcsOsi,
      ...rest
    } = Object.assign(options, placeholder?.dataset ?? {}, overrides ?? {});
    options = omitProperties(
      Object.assign({
        ...options,
        ...rest,
        displayOldPrice: toBoolean(displayOldPrice),
        displayPerUnit: toBoolean(displayPerUnit),
        displayRecurrence: toBoolean(displayRecurrence),
        displayTax: toBoolean(displayTax),
        displayPlanType: toBoolean(displayPlanType),
        forceTaxExclusive: toBoolean(forceTaxExclusive),
        perpetual: toBoolean(perpetual),
        displayAnnual: toBoolean(displayAnnual),
        promotionCode: computePromoStatus(promotionCode).effectivePromoCode,
        quantity: toQuantity(quantity, Defaults.quantity),
        alternativePrice: toBoolean(alternativePrice),
        wcsOsi: toOfferSelectorIds(wcsOsi)
      })
    );
    return options;
  }
  function buildPriceHTML(offers, options) {
    if (!Array.isArray(offers) || !offers.length || !options) {
      return "";
    }
    const { template } = options;
    let method;
    switch (template) {
      // TODO: use price template name constants, export them from `consonant-templates`
      case "discount":
        method = discount;
        break;
      case "strikethrough":
        method = priceStrikethrough;
        break;
      case "annual":
        method = priceAnnual;
        break;
      case "legal":
        method = legal;
        break;
      default:
        if (options.template === "optical" && options.alternativePrice) {
          method = priceOpticalAlternative;
        } else if (options.template === "optical") {
          method = priceOptical;
        } else if (options.displayAnnual && offers[0].planType === "ABM") {
          method = options.promotionCode ? pricePromoWithAnnual : priceWithAnnual;
        } else if (options.alternativePrice) {
          method = priceAlternative;
        } else {
          method = options.promotionCode ? pricePromo : price;
        }
    }
    let [offer] = offers;
    offer = { ...offer, ...offer.priceDetails };
    return method({ ...settings, ...options }, offer);
  }
  const createInlinePrice = InlinePrice.createInlinePrice;
  return {
    InlinePrice,
    buildPriceHTML,
    collectPriceOptions,
    createInlinePrice
  };
}

// src/settings.js
function getLocaleSettings({
  locale = void 0,
  country = void 0,
  language = void 0
} = {}) {
  language ?? (language = locale?.split("_")?.[0] || Defaults.language);
  country ?? (country = locale?.split("_")?.[1] || Defaults.country);
  locale ?? (locale = SUPPORTED_LANGUAGE_COUNTRY.includes(`${language}_${country}`) ? `${language}_${country}` : `${Defaults.language}_${Defaults.country}`);
  return { locale, country, language };
}
function getSettings(config2 = {}, service) {
  const ffDefaults = service.featureFlags[FF_DEFAULTS];
  const { commerce = {} } = config2;
  let env = Env.PRODUCTION;
  let wcsURL = WCS_PROD_URL;
  const checkoutClientId = getParameter("checkoutClientId", commerce) ?? Defaults.checkoutClientId;
  const checkoutWorkflowStep = toEnumeration(
    getParameter("checkoutWorkflowStep", commerce),
    CheckoutWorkflowStep,
    Defaults.checkoutWorkflowStep
  );
  const displayOldPrice = Defaults.displayOldPrice;
  const displayPerUnit = Defaults.displayPerUnit;
  const displayRecurrence = toBoolean(
    getParameter("displayRecurrence", commerce),
    Defaults.displayRecurrence
  );
  const displayTax = toBoolean(
    getParameter("displayTax", commerce),
    Defaults.displayTax
  );
  const displayPlanType = toBoolean(
    getParameter("displayPlanType", commerce),
    Defaults.displayPlanType
  );
  const entitlement = toBoolean(
    getParameter("entitlement", commerce),
    Defaults.entitlement
  );
  const modal = toBoolean(getParameter("modal", commerce), Defaults.modal);
  const forceTaxExclusive = toBoolean(
    getParameter("forceTaxExclusive", commerce),
    Defaults.forceTaxExclusive
  );
  const promotionCode = getParameter("promotionCode", commerce) ?? Defaults.promotionCode;
  const quantity = toQuantity(getParameter("quantity", commerce));
  const wcsApiKey = getParameter("wcsApiKey", commerce) ?? Defaults.wcsApiKey;
  let isStage = commerce?.env === "stage";
  let landscape = Landscape.PUBLISHED;
  const allowOverride = ["true", ""].includes(commerce.allowOverride);
  if (allowOverride) {
    isStage = (getParameter(PARAM_ENV, commerce, {
      metadata: false
    })?.toLowerCase() ?? commerce?.env) === "stage";
    landscape = toEnumeration(
      getParameter(PARAM_LANDSCAPE, commerce),
      Landscape,
      landscape
    );
  }
  if (isStage) {
    env = Env.STAGE;
    wcsURL = WCS_STAGE_URL;
  }
  const previewParam = getParameter(PARAM_MAS_PREVIEW) ?? config2.preview;
  const preview = typeof previewParam != "undefined" && previewParam !== "off" && previewParam !== "false";
  let previewSettings = {};
  if (preview) previewSettings = { preview };
  const masIOUrl = getParameter("mas-io-url") ?? config2.masIOUrl ?? `https://www${env === Env.STAGE ? ".stage" : ""}.adobe.com/mas/io`;
  const preselectPlan = getParameter("preselect-plan") ?? void 0;
  return {
    ...getLocaleSettings(config2),
    ...previewSettings,
    displayOldPrice,
    checkoutClientId,
    checkoutWorkflowStep,
    displayPerUnit,
    displayRecurrence,
    displayTax,
    displayPlanType,
    entitlement,
    extraOptions: Defaults.extraOptions,
    modal,
    env,
    forceTaxExclusive,
    promotionCode,
    quantity,
    alternativePrice: Defaults.alternativePrice,
    wcsApiKey,
    wcsURL,
    landscape,
    masIOUrl,
    ...preselectPlan && { preselectPlan }
    // only add if defined
  };
}

// src/utils/mas-fetch.js
async function masFetch(resource, options = {}, retries = 2, baseDelay = 100) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(resource, options);
      response.retryCount = attempt;
      return response;
    } catch (error) {
      lastError = error;
      lastError.retryCount = attempt;
      if (attempt > retries) break;
      await new Promise(
        (resolve) => setTimeout(resolve, baseDelay * (attempt + 1))
      );
    }
  }
  throw lastError;
}

// src/wcs.js
var NAMESPACE2 = "wcs";
function Wcs({ settings }) {
  const log2 = Log.module(NAMESPACE2);
  const { env, wcsApiKey: apiKey } = settings;
  const cache = /* @__PURE__ */ new Map();
  const queue = /* @__PURE__ */ new Map();
  let timer;
  let staleCache = /* @__PURE__ */ new Map();
  async function resolveWcsOffers(options, promises, reject = true) {
    const service = getService2();
    let message = ERROR_MESSAGE_OFFER_NOT_FOUND;
    log2.debug("Fetching:", options);
    let url = "";
    let response;
    if (options.offerSelectorIds.length > 1)
      throw new Error("Multiple OSIs are not supported anymore");
    const unresolvedPromises = new Map(promises);
    const [osi] = options.offerSelectorIds;
    const uniqueId = Date.now() + Math.random().toString(36).substring(2, 7);
    const startMark = `${NAMESPACE2}:${osi}:${uniqueId}${MARK_START_SUFFIX}`;
    const measureName = `${NAMESPACE2}:${osi}:${uniqueId}${MARK_DURATION_SUFFIX}`;
    let measure;
    try {
      performance.mark(startMark);
      url = new URL(settings.wcsURL);
      url.searchParams.set("offer_selector_ids", osi);
      url.searchParams.set("country", options.country);
      url.searchParams.set("locale", options.locale);
      url.searchParams.set(
        "landscape",
        env === Env.STAGE ? "ALL" : settings.landscape
      );
      url.searchParams.set("api_key", apiKey);
      if (options.language) {
        url.searchParams.set("language", options.language);
      }
      if (options.promotionCode) {
        url.searchParams.set("promotion_code", options.promotionCode);
      }
      if (options.currency) {
        url.searchParams.set("currency", options.currency);
      }
      response = await masFetch(url.toString(), {
        credentials: "omit"
      });
      if (response.ok) {
        let offers = [];
        try {
          const data = await response.json();
          log2.debug("Fetched:", options, data);
          offers = data.resolvedOffers ?? [];
        } catch (e) {
          log2.error(`Error parsing JSON: ${e.message}`, {
            ...e.context,
            ...service?.duration
          });
        }
        offers = offers.map(applyPlanType);
        promises.forEach(({ resolve }, offerSelectorId) => {
          const resolved = offers.filter(
            ({ offerSelectorIds }) => offerSelectorIds.includes(offerSelectorId)
          ).flat();
          if (resolved.length) {
            unresolvedPromises.delete(offerSelectorId);
            promises.delete(offerSelectorId);
            resolve(resolved);
          }
        });
      } else {
        message = ERROR_MESSAGE_BAD_REQUEST;
      }
    } catch (e) {
      message = `Network error: ${e.message}`;
    } finally {
      measure = performance.measure(measureName, startMark);
      performance.clearMarks(startMark);
      performance.clearMeasures(measureName);
    }
    if (reject && promises.size) {
      log2.debug("Missing:", { offerSelectorIds: [...promises.keys()] });
      const headers = getLogHeaders(response);
      promises.forEach((promise) => {
        promise.reject(
          new MasError(message, {
            ...options,
            ...headers,
            response,
            measure: printMeasure(measure),
            ...service?.duration
          })
        );
      });
    }
  }
  function flushQueue() {
    clearTimeout(timer);
    const pending = [...queue.values()];
    queue.clear();
    pending.forEach(
      ({ options, promises }) => resolveWcsOffers(options, promises)
    );
  }
  function prefillWcsCache(preloadedCache) {
    if (!preloadedCache || typeof preloadedCache !== "object") {
      throw new TypeError("Cache must be a Map or similar object");
    }
    const envKey = env === Env.STAGE ? "stage" : "prod";
    const envCache = preloadedCache[envKey];
    if (!envCache || typeof envCache !== "object") {
      log2.warn(`No cache found for environment: ${env}`);
      return;
    }
    for (const [key, value] of Object.entries(envCache)) {
      cache.set(key, Promise.resolve(value.map(applyPlanType)));
    }
    log2.debug(`Prefilled WCS cache with ${envCache.size} entries`);
  }
  function flushWcsCacheInternal() {
    const size = cache.size;
    staleCache = new Map(cache);
    cache.clear();
    log2.debug(`Moved ${size} cache entries to stale cache`);
  }
  function validateLanguageAndLocale(country, language, perpetual) {
    const validLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : Defaults.language;
    const validCountry = SUPPORTED_COUNTRIES.includes(country) ? country : Defaults.country;
    return {
      validCountry,
      validLanguage: country !== "GB" && !perpetual ? "MULT" : validLanguage,
      locale: SUPPORTED_LANGUAGE_COUNTRY.includes(
        `${validLanguage}_${validCountry}`
      ) ? `${validLanguage}_${validCountry}` : `${Defaults.language}_${Defaults.country}`
    };
  }
  function resolveOfferSelectors({
    country,
    language,
    perpetual = false,
    promotionCode = "",
    wcsOsi = []
  }) {
    const { validCountry, validLanguage, locale } = validateLanguageAndLocale(country, language, perpetual);
    const groupKey = [validCountry, validLanguage, promotionCode].filter((val) => val).join("-").toLowerCase();
    return wcsOsi.map((osi) => {
      const cacheKey = `${osi}-${groupKey}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }
      const promiseWithFallback = new Promise((resolve, reject) => {
        let group = queue.get(groupKey);
        if (!group) {
          const options = {
            country: validCountry,
            locale,
            ...perpetual ? {} : { language: validLanguage },
            offerSelectorIds: []
          };
          const promises = /* @__PURE__ */ new Map();
          group = { options, promises };
          queue.set(groupKey, group);
        }
        if (promotionCode) {
          group.options.promotionCode = promotionCode;
        }
        group.options.offerSelectorIds.push(osi);
        group.promises.set(osi, {
          resolve,
          reject
        });
        flushQueue();
      }).catch((error) => {
        if (staleCache.has(cacheKey)) {
          return staleCache.get(cacheKey);
        }
        throw error;
      });
      cache.set(cacheKey, promiseWithFallback);
      return promiseWithFallback;
    });
  }
  return {
    Commitment,
    PlanType,
    Term,
    applyPlanType,
    resolveOfferSelectors,
    flushWcsCacheInternal,
    prefillWcsCache,
    validateLanguageAndLocale
  };
}

// src/mas-commerce-service.js
var TAG_NAME_SERVICE2 = "mas-commerce-service";
var MARK_START = "mas-commerce-service:start";
var MEASURE_READY = "mas-commerce-service:ready";
var _measure, _featureFlags, _MasCommerceService_instances, config_get, getFeatureFlag_fn;
var MasCommerceService = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _MasCommerceService_instances);
    __privateAdd(this, _measure);
    __privateAdd(this, _featureFlags);
    __publicField(this, "lastLoggingTime", 0);
  }
  async registerCheckoutAction(action) {
    if (typeof action != "function") return;
    this.buildCheckoutAction = async (offers, options, el) => {
      const checkoutAction = await action?.(
        offers,
        options,
        this.imsSignedInPromise,
        el
      );
      if (checkoutAction) {
        return checkoutAction;
      }
      return null;
    };
  }
  get featureFlags() {
    if (!__privateGet(this, _featureFlags)) {
      __privateSet(this, _featureFlags, {
        [FF_DEFAULTS]: __privateMethod(this, _MasCommerceService_instances, getFeatureFlag_fn).call(this, FF_DEFAULTS)
      });
    }
    return __privateGet(this, _featureFlags);
  }
  activate() {
    const config2 = __privateGet(this, _MasCommerceService_instances, config_get);
    const settings = getSettings(config2, this);
    updateConfig(config2.lana);
    const log2 = Log.init(config2.hostEnv).module("service");
    log2.debug("Activating:", config2);
    const price2 = getPriceLiterals(settings);
    const literals = { price: price2 };
    const providers = {
      checkout: /* @__PURE__ */ new Set(),
      price: /* @__PURE__ */ new Set()
    };
    const startup = { literals, providers, settings };
    Object.defineProperties(
      this,
      Object.getOwnPropertyDescriptors({
        // Activate modules and expose their API as combined flat object
        ...Checkout(startup),
        ...Ims(startup),
        ...Price(startup),
        ...Wcs(startup),
        ...constants_exports,
        // Defined serviceweb  component API
        Log,
        get defaults() {
          return Defaults;
        },
        get log() {
          return Log;
        },
        /* c8 ignore next 11 */
        get providers() {
          return {
            checkout(provider) {
              providers.checkout.add(provider);
              return () => providers.checkout.delete(provider);
            },
            price(provider) {
              providers.price.add(provider);
              return () => providers.price.delete(provider);
            },
            has: (providerFunction) => providers.price.has(providerFunction) || providers.checkout.has(providerFunction)
          };
        },
        get settings() {
          return settings;
        }
      })
    );
    log2.debug("Activated:", { literals, settings });
    const event = new CustomEvent(EVENT_TYPE_READY, {
      bubbles: true,
      cancelable: false,
      detail: this
    });
    performance.mark(MEASURE_READY);
    __privateSet(this, _measure, performance.measure(MEASURE_READY, MARK_START));
    this.dispatchEvent(event);
    setTimeout(() => {
      this.logFailedRequests();
    }, 1e4);
  }
  connectedCallback() {
    performance.mark(MARK_START);
    this.activate();
  }
  flushWcsCache() {
    this.flushWcsCacheInternal();
    this.log.debug("Flushed WCS cache");
  }
  refreshOffers() {
    this.flushWcsCacheInternal();
    document.querySelectorAll(SELECTOR_MAS_ELEMENT).forEach((el) => el.requestUpdate(true));
    this.log.debug("Refreshed WCS offers");
    this.logFailedRequests();
  }
  refreshFragments() {
    this.flushWcsCacheInternal();
    customElements.get("aem-fragment")?.cache.clear();
    document.querySelectorAll("aem-fragment").forEach((el) => el.refresh(false));
    this.log.debug("Refreshed AEM fragments");
    this.logFailedRequests();
  }
  get duration() {
    return {
      "mas-commerce-service:measure": printMeasure(__privateGet(this, _measure))
    };
  }
  /**
   * Logs failed network requests related to AEM fragments and WCS commerce artifacts.
   * Identifies failed resources by checking for zero transfer size, zero duration,
   * response status less than 200, or response status greater than or equal to 400.
   * Only logs errors if any of the failed resources are fragment or commerce artifact requests.
   */
  /* c8 ignore next 21 */
  logFailedRequests() {
    const failedResources = [...performance.getEntriesByType("resource")].filter(({ startTime }) => startTime > this.lastLoggingTime).filter(
      ({ transferSize, duration, responseStatus }) => transferSize === 0 && duration === 0 && responseStatus < 200 || responseStatus >= 400
    );
    const uniqueFailedResources = Array.from(
      new Map(
        failedResources.map((resource) => [resource.name, resource])
      ).values()
    );
    if (uniqueFailedResources.some(
      ({ name }) => /(\/fragment\?|web_commerce_artifact)/.test(name)
    )) {
      const failedUrls = uniqueFailedResources.map(({ name }) => name);
      this.log.error("Failed requests:", {
        failedUrls,
        ...this.duration
      });
    }
    this.lastLoggingTime = performance.now().toFixed(3);
  }
};
_measure = new WeakMap();
_featureFlags = new WeakMap();
_MasCommerceService_instances = new WeakSet();
config_get = function() {
  const env = this.getAttribute("env") ?? "prod";
  const config2 = {
    commerce: { env },
    hostEnv: { name: env },
    lana: {
      tags: this.getAttribute("lana-tags"),
      sampleRate: parseInt(
        this.getAttribute("lana-sample-rate") ?? 1,
        10
      ),
      isProdDomain: env === "prod"
    },
    masIOUrl: this.getAttribute("mas-io-url")
  };
  ["locale", "country", "language", "preview"].forEach((attribute) => {
    const value = this.getAttribute(attribute);
    if (value) {
      config2[attribute] = value;
    }
  });
  [
    "checkout-workflow-step",
    "force-tax-exclusive",
    "checkout-client-id",
    "allow-override",
    "wcs-api-key"
  ].forEach((attribute) => {
    const value = this.getAttribute(attribute);
    if (value != null) {
      const camelCaseAttribute = attribute.replace(
        /-([a-z])/g,
        (g) => g[1].toUpperCase()
      );
      config2.commerce[camelCaseAttribute] = value;
    }
  });
  return config2;
};
getFeatureFlag_fn = function(ff) {
  return ["on", "true", true].includes(
    this.getAttribute(`data-${ff}`) || getParameter(ff)
  );
};
if (!window.customElements.get(TAG_NAME_SERVICE2)) {
  window.customElements.define(TAG_NAME_SERVICE2, MasCommerceService);
}

// src/merch-card-collection.js
var MERCH_CARD_COLLECTION = "merch-card-collection";
var MERCH_CARD_COLLECTION_LOAD_TIMEOUT = 2e4;
var VARIANT_CLASSES = {
  catalog: ["four-merch-cards"],
  plans: ["four-merch-cards"],
  plansThreeColumns: ["three-merch-cards"]
};
var SIDENAV_AUTOCLOSE = {
  plans: true
};
var categoryFilter = (elements, { filter }) => elements.filter(
  (element) => element?.filters && element?.filters.hasOwnProperty(filter)
);
var typeFilter = (elements, { types }) => {
  if (!types) return elements;
  types = types.split(",");
  return elements.filter(
    (element) => types.some((type) => element.types.includes(type))
  );
};
var alphabeticalSorter = (elements) => elements.sort(
  (a, b) => (a.title ?? "").localeCompare(b.title ?? "", "en", {
    sensitivity: "base"
  })
);
var authoredSorter = (elements, { filter }) => elements.sort((a, b) => {
  if (b.filters[filter]?.order == void 0 || isNaN(b.filters[filter]?.order))
    return -1;
  if (a.filters[filter]?.order == void 0 || isNaN(a.filters[filter]?.order))
    return 1;
  return a.filters[filter].order - b.filters[filter].order;
});
var searcher = (elements, { search }) => {
  if (search?.length) {
    search = search.toLowerCase();
    return elements.filter((element) => {
      const haystack = (element.title ?? "").toLowerCase();
      return haystack.includes(search);
    });
  }
  return elements;
};
var _overrideMap, _service3, _log, _MerchCardCollection_instances, fail_fn;
var MerchCardCollection = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _MerchCardCollection_instances);
    __privateAdd(this, _overrideMap, {});
    __privateAdd(this, _service3);
    __privateAdd(this, _log);
    this.id = null;
    this.filter = "all";
    this.hasMore = false;
    this.resultCount = void 0;
    this.displayResult = false;
    this.data = null;
    this.variant = null;
    this.hydrating = false;
    this.hydrationReady = null;
    this.literalsHandlerAttached = false;
  }
  render() {
    return html12` <slot></slot>
            ${this.footer}`;
  }
  checkReady() {
    const aemFragment = this.querySelector("aem-fragment");
    if (!aemFragment) return Promise.resolve(true);
    const timeoutPromise = new Promise(
      (resolve) => setTimeout(
        () => resolve(false),
        MERCH_CARD_COLLECTION_LOAD_TIMEOUT
      )
    );
    return Promise.race([this.hydrationReady, timeoutPromise]);
  }
  updated(changedProperties) {
    if (!this.querySelector("merch-card")) return;
    let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
    const children = [...this.children].filter(
      (child) => child.tagName === "MERCH-CARD"
    );
    if (children.length === 0) return;
    if (changedProperties.has("singleApp") && this.singleApp) {
      children.forEach((card) => {
        card.updateFilters(card.name === this.singleApp);
      });
    }
    const sorter = this.sort === SORT_ORDER.alphabetical ? alphabeticalSorter : authoredSorter;
    const reducers = [categoryFilter, typeFilter, searcher, sorter];
    let result = reducers.reduce((elements, reducer) => reducer(elements, this), children).map((element, index) => [element, index]);
    this.resultCount = result.length;
    if (this.page && this.limit) {
      const pageSize = this.page * this.limit;
      this.hasMore = result.length > pageSize;
      result = result.filter(([, index]) => index < pageSize);
    }
    let reduced = new Map(result.reverse());
    for (const card of reduced.keys()) {
      this.prepend(card);
    }
    children.forEach((child) => {
      if (reduced.has(child)) {
        child.size = child.filters[this.filter]?.size;
        child.style.removeProperty("display");
        child.requestUpdate();
      } else {
        child.style.display = "none";
        child.size = void 0;
      }
    });
    window.scrollTo(0, lastScrollTop);
    this.updateComplete.then(() => {
      this.dispatchLiteralsChanged();
      if (this.sidenav && !this.literalsHandlerAttached) {
        this.sidenav.addEventListener(
          EVENT_MERCH_SIDENAV_SELECT,
          () => {
            this.dispatchLiteralsChanged();
          }
        );
        this.literalsHandlerAttached = true;
      }
    });
  }
  dispatchLiteralsChanged() {
    this.dispatchEvent(
      new CustomEvent(EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED, {
        detail: {
          resultCount: this.resultCount,
          searchTerm: this.search,
          filter: this.sidenav?.filters?.selectedText
        }
      })
    );
  }
  buildOverrideMap() {
    __privateSet(this, _overrideMap, {});
    this.overrides?.split(",").forEach((token) => {
      const [key, value] = token?.split(":");
      if (key && value) {
        __privateGet(this, _overrideMap)[key] = value;
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();
    __privateSet(this, _service3, getService());
    if (__privateGet(this, _service3)) {
      __privateSet(this, _log, __privateGet(this, _service3).Log.module(MERCH_CARD_COLLECTION));
    }
    this.buildOverrideMap();
    this.init();
  }
  async init() {
    await this.hydrate();
    this.sidenav = this.parentElement.querySelector("merch-sidenav");
    if (this.filtered) {
      this.filter = this.filtered;
      this.page = 1;
    } else {
      this.startDeeplink();
    }
    this.initializePlaceholders();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopDeeplink?.();
  }
  initializeHeader() {
    const header = document.createElement("merch-card-collection-header");
    header.collection = this;
    header.classList.add(this.variant);
    this.parentElement.insertBefore(header, this);
    this.header = header;
    const existingPlaceholders = this.querySelectorAll("[placeholder]");
    existingPlaceholders.forEach((placeholder) => {
      const key = placeholder.getAttribute("slot");
      if (this.header.placeholderKeys.includes(key)) {
        this.header.append(placeholder);
      }
    });
  }
  initializePlaceholders() {
    const placeholders = this.data?.placeholders || {};
    for (const key of Object.keys(placeholders)) {
      const value = placeholders[key];
      const tag = value.includes("<p>") ? "div" : "p";
      const placeholder = document.createElement(tag);
      placeholder.setAttribute("slot", key);
      placeholder.setAttribute("placeholder", "");
      placeholder.innerHTML = value;
      this.append(placeholder);
    }
  }
  attachSidenav(sidenav, append = true) {
    if (!sidenav) return;
    if (append) this.parentElement.prepend(sidenav);
    this.sidenav = sidenav;
    this.sidenav.variant = this.variant;
    this.sidenav.classList.add(this.variant);
    if (SIDENAV_AUTOCLOSE[this.variant])
      this.sidenav.setAttribute("autoclose", "");
    this.initializeHeader();
    this.dispatchEvent(
      new CustomEvent(EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED)
    );
  }
  async hydrate() {
    if (this.hydrating) return false;
    const aemFragment = this.querySelector("aem-fragment");
    if (!aemFragment) return;
    this.id = aemFragment.getAttribute("fragment");
    this.hydrating = true;
    let resolveHydration;
    this.hydrationReady = new Promise((resolve) => {
      resolveHydration = resolve;
    });
    const self = this;
    function normalizePayload(fragment, overrideMap) {
      const payload = {
        cards: [],
        hierarchy: [],
        placeholders: fragment.placeholders
      };
      function traverseReferencesTree(root, references) {
        for (const reference of references) {
          if (reference.fieldName === "cards") {
            if (payload.cards.findIndex(
              (card) => card.id === reference.identifier
            ) !== -1)
              continue;
            payload.cards.push(
              fragment.references[reference.identifier].value
            );
            continue;
          }
          const { fields } = fragment.references[reference.identifier].value;
          const collection = {
            label: fields.label || "",
            icon: fields.icon,
            iconLight: fields.iconLight,
            queryLabel: fields.queryLabel,
            cards: fields.cards ? fields.cards.map(
              (cardId) => overrideMap[cardId] || cardId
            ) : [],
            collections: []
          };
          if (fields.defaultchild) {
            collection.defaultchild = overrideMap[fields.defaultchild] || fields.defaultchild;
          }
          root.push(collection);
          traverseReferencesTree(
            collection.collections,
            reference.referencesTree
          );
        }
      }
      traverseReferencesTree(payload.hierarchy, fragment.referencesTree);
      if (payload.hierarchy.length === 0) {
        self.filtered = "all";
      }
      return payload;
    }
    aemFragment.addEventListener(EVENT_AEM_ERROR, (event) => {
      __privateMethod(this, _MerchCardCollection_instances, fail_fn).call(this, "Error loading AEM fragment", event.detail);
      this.hydrating = false;
      aemFragment.remove();
    });
    aemFragment.addEventListener(EVENT_AEM_LOAD, async (event) => {
      this.data = normalizePayload(event.detail, __privateGet(this, _overrideMap));
      const { cards, hierarchy } = this.data;
      const rootDefaultChild = hierarchy.length === 0 && event.detail.fields?.defaultchild ? __privateGet(this, _overrideMap)[event.detail.fields.defaultchild] || event.detail.fields.defaultchild : null;
      aemFragment.cache.add(...cards);
      const checkDefaultChild = (collections, fragmentId) => {
        for (const collection of collections) {
          if (collection.defaultchild === fragmentId) return true;
          if (collection.collections && checkDefaultChild(collection.collections, fragmentId))
            return true;
        }
        return false;
      };
      for (const fragment of cards) {
        let populateFilters = function(level) {
          for (const node of level) {
            const index = node.cards.indexOf(fragmentId);
            if (index === -1) continue;
            const name = node.queryLabel ?? node?.label?.toLowerCase() ?? "";
            merchCard.filters[name] = {
              order: index + 1,
              size: fragment.fields.size
            };
            populateFilters(node.collections);
          }
        };
        const merchCard = document.createElement("merch-card");
        const fragmentId = __privateGet(this, _overrideMap)[fragment.id] || fragment.id;
        merchCard.setAttribute("consonant", "");
        merchCard.setAttribute("style", "");
        const variantMapping = getFragmentMapping(
          fragment.fields.variant
        );
        if (variantMapping?.supportsDefaultChild) {
          const isDefault = rootDefaultChild ? fragmentId === rootDefaultChild : checkDefaultChild(hierarchy, fragmentId);
          if (isDefault) {
            merchCard.setAttribute("data-default-card", "true");
          }
        }
        populateFilters(hierarchy);
        const mcAemFragment = document.createElement("aem-fragment");
        mcAemFragment.setAttribute("fragment", fragmentId);
        merchCard.append(mcAemFragment);
        if (Object.keys(merchCard.filters).length === 0) {
          merchCard.filters = {
            all: {
              order: cards.indexOf(fragment) + 1,
              size: fragment.fields.size
            }
          };
        }
        this.append(merchCard);
      }
      let nmbOfColumns = "";
      let variant = normalizeVariant(cards[0]?.fields?.variant);
      this.variant = variant;
      if (variant === "plans" && cards.length === 3 && !cards.some((card) => card.fields?.size?.includes("wide")))
        nmbOfColumns = "ThreeColumns";
      if (variant) {
        this.classList.add(
          "merch-card-collection",
          variant,
          ...VARIANT_CLASSES[`${variant}${nmbOfColumns}`] || []
        );
      }
      this.displayResult = true;
      this.hydrating = false;
      aemFragment.remove();
      resolveHydration(true);
    });
    await this.hydrationReady;
  }
  get footer() {
    if (this.filtered) return;
    return html12`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`;
  }
  get showMoreButton() {
    if (!this.hasMore) return;
    return html12`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`;
  }
  sortChanged(event) {
    if (event.target.value === SORT_ORDER.authored) {
      pushState({ sort: void 0 });
    } else {
      pushState({ sort: event.target.value });
    }
    this.dispatchEvent(
      new CustomEvent(EVENT_MERCH_CARD_COLLECTION_SORT, {
        bubbles: true,
        composed: true,
        detail: {
          value: event.target.value
        }
      })
    );
  }
  async showMore() {
    this.dispatchEvent(
      new CustomEvent(EVENT_MERCH_CARD_COLLECTION_SHOWMORE, {
        bubbles: true,
        composed: true
      })
    );
    const page = this.page + 1;
    pushState({ page });
    this.page = page;
    await this.updateComplete;
  }
  startDeeplink() {
    this.stopDeeplink = deeplink(
      ({ category, filter, types, sort, search, single_app, page }) => {
        filter = filter || category;
        if (!this.filtered && filter && filter !== this.filter) {
          setTimeout(() => {
            pushState({ page: void 0 });
            this.page = 1;
          }, 1);
        }
        if (!this.filtered) {
          this.filter = filter ?? this.filter;
        }
        this.types = types ?? "";
        this.search = search ?? "";
        this.singleApp = single_app;
        this.sort = sort;
        this.page = Number(page) || 1;
      }
    );
  }
  openFilters(e) {
    this.sidenav?.showModal(e);
  }
};
_overrideMap = new WeakMap();
_service3 = new WeakMap();
_log = new WeakMap();
_MerchCardCollection_instances = new WeakSet();
fail_fn = function(error, details = {}, dispatch = true) {
  __privateGet(this, _log).error(`merch-card-collection: ${error}`, details);
  this.failed = true;
  if (!dispatch) return;
  this.dispatchEvent(
    new CustomEvent(EVENT_MAS_ERROR, {
      detail: { ...details, message: error },
      bubbles: true,
      composed: true
    })
  );
};
__publicField(MerchCardCollection, "properties", {
  id: { type: String, attribute: "id", reflect: true },
  displayResult: { type: Boolean, attribute: "display-result" },
  filter: { type: String, attribute: "filter", reflect: true },
  filtered: { type: String, attribute: "filtered", reflect: true },
  // freeze filter
  hasMore: { type: Boolean },
  limit: { type: Number, attribute: "limit" },
  overrides: { type: String },
  page: { type: Number, attribute: "page", reflect: true },
  resultCount: {
    type: Number
  },
  search: { type: String, attribute: "search", reflect: true },
  sidenav: { type: Object },
  singleApp: { type: String, attribute: "single-app", reflect: true },
  sort: {
    type: String,
    attribute: "sort",
    default: SORT_ORDER.authored,
    reflect: true
  },
  types: { type: String, attribute: "types", reflect: true }
});
__publicField(MerchCardCollection, "styles", css9`
        #footer {
            grid-column: 1 / -1;
            justify-self: stretch;
            color: var(--merch-color-grey-80);
            order: 1000;
        }

        sp-theme {
            display: contents;
        }
    `);
MerchCardCollection.SortOrder = SORT_ORDER;
customElements.define(MERCH_CARD_COLLECTION, MerchCardCollection);
var RESULT_TEXT_SLOT_NAMES = {
  // no search
  filters: ["noResultText", "resultText", "resultsText"],
  filtersMobile: ["noResultText", "resultMobileText", "resultsMobileText"],
  // search on desktop
  search: ["noSearchResultsText", "searchResultText", "searchResultsText"],
  // search on mobile
  searchMobile: [
    "noSearchResultsMobileText",
    "searchResultMobileText",
    "searchResultsMobileText"
  ]
};
var updatePlaceholders = (el, key, value) => {
  const placeholders = el.querySelectorAll(`[data-placeholder="${key}"]`);
  placeholders.forEach((placeholder) => {
    placeholder.innerText = value || "";
  });
};
var defaultVisibility = {
  search: ["mobile", "tablet"],
  filter: ["mobile", "tablet"],
  sort: true,
  result: true,
  custom: false
};
var SEARCH_SIZE = {
  catalog: "l"
};
var _visibility, _merchCardElement;
var MerchCardCollectionHeader = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _visibility);
    __privateAdd(this, _merchCardElement);
    __publicField(this, "tablet", new MatchMediaController(this, TABLET_UP));
    __publicField(this, "desktop", new MatchMediaController(this, DESKTOP_UP));
    this.collection = null;
    __privateSet(this, _visibility, {
      search: false,
      filter: false,
      sort: false,
      result: false,
      custom: false
    });
    this.updateLiterals = this.updateLiterals.bind(this);
    this.handleSidenavAttached = this.handleSidenavAttached.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    this.collection?.addEventListener(
      EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
      this.updateLiterals
    );
    this.collection?.addEventListener(
      EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED,
      this.handleSidenavAttached
    );
    __privateSet(this, _merchCardElement, customElements.get("merch-card"));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.collection?.removeEventListener(
      EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
      this.updateLiterals
    );
    this.collection?.removeEventListener(
      EVENT_MERCH_CARD_COLLECTION_SIDENAV_ATTACHED,
      this.handleSidenavAttached
    );
  }
  willUpdate() {
    __privateGet(this, _visibility).search = this.getVisibility("search");
    __privateGet(this, _visibility).filter = this.getVisibility("filter");
    __privateGet(this, _visibility).sort = this.getVisibility("sort");
    __privateGet(this, _visibility).result = this.getVisibility("result");
    __privateGet(this, _visibility).custom = this.getVisibility("custom");
  }
  parseVisibilityOptions(visibility, type) {
    if (!visibility) return null;
    if (!Object.hasOwn(visibility, type)) return null;
    const typeVisibility = visibility[type];
    if (typeVisibility === false) return false;
    if (typeVisibility === true) return true;
    return typeVisibility.includes(this.currentMedia);
  }
  getVisibility(type) {
    const visibility = __privateGet(this, _merchCardElement).getCollectionOptions(
      this.collection?.variant
    )?.headerVisibility;
    const typeVisibility = this.parseVisibilityOptions(visibility, type);
    if (typeVisibility !== null) return typeVisibility;
    return this.parseVisibilityOptions(defaultVisibility, type);
  }
  get sidenav() {
    return this.collection?.sidenav;
  }
  get search() {
    return this.collection?.search;
  }
  get resultCount() {
    return this.collection?.resultCount;
  }
  get variant() {
    return this.collection?.variant;
  }
  get isMobile() {
    return !this.isTablet && !this.isDesktop;
  }
  get isTablet() {
    return this.tablet.matches && !this.desktop.matches;
  }
  get isDesktop() {
    return this.desktop.matches;
  }
  get currentMedia() {
    if (this.isDesktop) return "desktop";
    if (this.isTablet) return "tablet";
    return "mobile";
  }
  get searchAction() {
    if (!__privateGet(this, _visibility).search) return nothing3;
    const searchPlaceholder = getSlotText(this, "searchText");
    if (!searchPlaceholder) return nothing3;
    return html12`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${searchPlaceholder}"
                    .size=${SEARCH_SIZE[this.variant]}
                ></sp-search>
            </merch-search>
        `;
  }
  get filterAction() {
    if (!__privateGet(this, _visibility).filter) return nothing3;
    if (!this.sidenav) return nothing3;
    return html12`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `;
  }
  get sortAction() {
    if (!__privateGet(this, _visibility).sort) return nothing3;
    const sortText = getSlotText(this, "sortText");
    if (!sortText) return;
    const popularityText = getSlotText(this, "popularityText");
    const alphabeticallyText = getSlotText(this, "alphabeticallyText");
    if (!(popularityText && alphabeticallyText)) return;
    const alphabetical = this.collection?.sort === SORT_ORDER.alphabetical;
    return html12`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${alphabetical ? SORT_ORDER.alphabetical : SORT_ORDER.authored}"
            >
                <span slot="label-only"
                    >${sortText}:
                    ${alphabetical ? alphabeticallyText : popularityText}</span
                >
                <sp-menu-item value="${SORT_ORDER.authored}"
                    >${popularityText}</sp-menu-item
                >
                <sp-menu-item value="${SORT_ORDER.alphabetical}"
                    >${alphabeticallyText}</sp-menu-item
                >
            </sp-action-menu>
        `;
  }
  get resultSlotName() {
    const slotType = `${this.search ? "search" : "filters"}${this.isMobile || this.isTablet ? "Mobile" : ""}`;
    return RESULT_TEXT_SLOT_NAMES[slotType][Math.min(this.resultCount, 2)];
  }
  get resultLabel() {
    if (!__privateGet(this, _visibility).result) return nothing3;
    if (!this.sidenav) return nothing3;
    const type = this.search ? "search" : "filter";
    const quantity = !this.resultCount ? "none" : this.resultCount === 1 ? "single" : "multiple";
    return html12` <div
            id="result"
            aria-live="polite"
            type=${type}
            quantity=${quantity}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`;
  }
  get customArea() {
    if (!__privateGet(this, _visibility).custom) return nothing3;
    const customHeaderAreaGetter = __privateGet(this, _merchCardElement).getCollectionOptions(
      this.collection?.variant
    )?.customHeaderArea;
    if (!customHeaderAreaGetter) return nothing3;
    const customHeaderArea = customHeaderAreaGetter(this.collection);
    if (!customHeaderArea || customHeaderArea === nothing3) return nothing3;
    return html12`<div id="custom" role="heading" aria-level="2">
            ${customHeaderArea}
        </div>`;
  }
  // #region Handlers
  openFilters(event) {
    this.sidenav.showModal(event);
  }
  updateLiterals(event) {
    Object.keys(event.detail).forEach((key) => {
      updatePlaceholders(this, key, event.detail[key]);
    });
    this.requestUpdate();
  }
  handleSidenavAttached() {
    this.requestUpdate();
  }
  render() {
    return html12`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `;
  }
  get placeholderKeys() {
    return [
      "searchText",
      "filtersText",
      "sortText",
      "popularityText",
      "alphabeticallyText",
      "noResultText",
      "resultText",
      "resultsText",
      "resultMobileText",
      "resultsMobileText",
      "noSearchResultsText",
      "searchResultText",
      "searchResultsText",
      "noSearchResultsMobileText",
      "searchResultMobileText",
      "searchResultsMobileText"
    ];
  }
};
_visibility = new WeakMap();
_merchCardElement = new WeakMap();
__publicField(MerchCardCollectionHeader, "styles", css9`
        :host {
            --merch-card-collection-header-max-width: var(
                --merch-card-collection-card-width
            );
            --merch-card-collection-header-margin-bottom: 32px;
            --merch-card-collection-header-column-gap: 8px;
            --merch-card-collection-header-row-gap: 16px;
            --merch-card-collection-header-columns: auto auto;
            --merch-card-collection-header-areas: 'search search' 'filter sort'
                'result result';
            --merch-card-collection-header-search-max-width: unset;
            --merch-card-collection-header-filter-height: 40px;
            --merch-card-collection-header-filter-font-size: 16px;
            --merch-card-collection-header-filter-padding: 15px;
            --merch-card-collection-header-sort-height: var(
                --merch-card-collection-header-filter-height
            );
            --merch-card-collection-header-sort-font-size: var(
                --merch-card-collection-header-filter-font-size
            );
            --merch-card-collection-header-sort-padding: var(
                --merch-card-collection-header-filter-padding
            );
            --merch-card-collection-header-result-font-size: 14px;
        }

        sp-theme {
            font-size: inherit;
        }

        #header {
            display: grid;
            column-gap: var(--merch-card-collection-header-column-gap);
            row-gap: var(--merch-card-collection-header-row-gap);
            align-items: center;
            grid-template-columns: var(--merch-card-collection-header-columns);
            grid-template-areas: var(--merch-card-collection-header-areas);
            margin-bottom: var(--merch-card-collection-header-margin-bottom);
            max-width: var(--merch-card-collection-header-max-width);
        }

        #header:empty {
            margin-bottom: 0;
        }

        #search {
            grid-area: search;
        }

        #search sp-search {
            max-width: var(--merch-card-collection-header-search-max-width);
            width: 100%;
        }

        #filter {
            grid-area: filter;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-filter-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-filter-height
            );
        }

        #filter slot[name='filtersText'] {
            font-size: var(--merch-card-collection-header-filter-font-size);
        }

        #sort {
            grid-area: sort;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-sort-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-sort-height
            );
        }

        #sort [slot='label-only'] {
            font-size: var(--merch-card-collection-header-sort-font-size);
        }

        #result {
            grid-area: result;
            font-size: var(--merch-card-collection-header-result-font-size);
        }

        #result[type='search'][quantity='none'] {
            font-size: inherit;
        }

        #custom {
            grid-area: custom;
        }

        /* tablets */
        @media screen and ${unsafeCSS2(TABLET_UP)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${unsafeCSS2(DESKTOP_UP)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);
customElements.define(
  "merch-card-collection-header",
  MerchCardCollectionHeader
);
export {
  MerchCardCollection,
  MerchCardCollectionHeader as default
};
//# sourceMappingURL=merch-card-collection.js.map
